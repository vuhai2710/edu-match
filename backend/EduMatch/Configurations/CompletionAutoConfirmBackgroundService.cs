using EduMatch.Common.Enums;
using EduMatch.Data;
using EduMatch.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduMatch.Configurations
{
  public class CompletionAutoConfirmBackgroundService : BackgroundService
  {
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<CompletionAutoConfirmBackgroundService> _logger;
    private readonly TimeSpan _interval;
    private static readonly TimeSpan AutoConfirmThreshold = TimeSpan.FromHours(72);

    public CompletionAutoConfirmBackgroundService(
      IServiceScopeFactory scopeFactory,
      ILogger<CompletionAutoConfirmBackgroundService> logger,
      IOptions<BackgroundJobSettings> options)
    {
      _scopeFactory = scopeFactory;
      _logger = logger;
      _interval = TimeSpan.FromSeconds(options.Value.CompletionAutoConfirmIntervalSeconds);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
      _logger.LogInformation(
        "CompletionAutoConfirmBackgroundService started with interval {Interval}s",
        _interval.TotalSeconds);

      while (!stoppingToken.IsCancellationRequested)
      {
        try
        {
          await ProcessAutoConfirmationsAsync(stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
          break;
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "CompletionAutoConfirmBackgroundService encountered an error");
        }

        await Task.Delay(_interval, stoppingToken);
      }
    }

    private async Task ProcessAutoConfirmationsAsync(CancellationToken ct)
    {
      using var scope = _scopeFactory.CreateScope();
      var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
      var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

      var cutoff = DateTime.UtcNow - AutoConfirmThreshold;

      var expiredRequests = await db.ClassCompletionRequests
        .Include(r => r.Class)
          .ThenInclude(c => c.Tutor)
        .Include(r => r.RequestedByUser)
        .Where(r =>
          r.Status == ClassCompletionRequestStatus.Pending
          && r.CreatedAt <= cutoff
          && r.Class.Status == ClassStatus.Active)
        .ToListAsync(ct);

      if (expiredRequests.Count == 0)
      {
        return;
      }

      var now = DateTime.UtcNow;

      foreach (var request in expiredRequests)
      {
        request.Status = ClassCompletionRequestStatus.AutoConfirmed;
        request.RespondedAt = now;
        request.UpdatedAt = now;

        request.Class.Status = ClassStatus.Completed;
        request.Class.EndDate = now;
        request.Class.UpdatedAt = now;
      }

      await db.SaveChangesAsync(ct);

      _logger.LogInformation(
        "CompletionAutoConfirmBackgroundService auto-confirmed {Count} completion requests at {Time}",
        expiredRequests.Count, now);

      foreach (var request in expiredRequests)
      {
        var classEntity = request.Class;
        var studentUserId = classEntity.StudentId;
        var tutorUserId = classEntity.Tutor.UserId;
        var requesterName = request.RequestedByUser?.FullName ?? "Người dùng";

        var adminIds = await db.Users
          .Where(u => u.Role == UserRole.Admin)
          .Select(u => u.Id)
          .Distinct()
          .ToListAsync(ct);

        var recipientIds = new[] { studentUserId, tutorUserId }
          .Concat(adminIds)
          .Distinct();

        await notificationService.SendToMultipleAsync(
          recipientIds,
          "Lớp tự động hoàn thành",
          $"Lớp {classEntity.Code} đã tự động được xác nhận hoàn thành do không có phản hồi trong 3 ngày kể từ khi {requesterName} gửi yêu cầu.",
          NotificationType.ClassCompletionAutoConfirmed,
          "Class",
          classEntity.Id,
          $"/classes/{classEntity.Id}");
      }
    }
  }
}
