using EduMatch.Common.Enums;
using EduMatch.Data;
using EduMatch.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduMatch.Configurations
{
  public class ScheduleExpiryBackgroundService : BackgroundService
  {
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ScheduleExpiryBackgroundService> _logger;
    private readonly TimeSpan _interval;

    public ScheduleExpiryBackgroundService(
      IServiceScopeFactory scopeFactory,
      ILogger<ScheduleExpiryBackgroundService> logger,
      IOptions<BackgroundJobSettings> options)
    {
      _scopeFactory = scopeFactory;
      _logger = logger;
      _interval = TimeSpan.FromSeconds(options.Value.ScheduleExpiryIntervalSeconds);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
      _logger.LogInformation(
        "ScheduleExpiryBackgroundService started with interval {Interval}s",
        _interval.TotalSeconds);

      while (!stoppingToken.IsCancellationRequested)
      {
        try
        {
          await ProcessExpiredSchedulesAsync(stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
          break;
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "ScheduleExpiryBackgroundService encountered an error");
        }

        await Task.Delay(_interval, stoppingToken);
      }
    }

    private async Task ProcessExpiredSchedulesAsync(CancellationToken ct)
    {
      using var scope = _scopeFactory.CreateScope();
      var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
      var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

      var now = DateTime.UtcNow;

      var expiredRequests = await db.LearningRequests
        .Include(lr => lr.Tutor)
        .Where(lr => lr.ScheduleExpiresAt < now
          && (lr.Status == LearningRequestStatus.Pending
            || lr.Status == LearningRequestStatus.Negotiating))
        .ToListAsync(ct);

      if (expiredRequests.Count == 0)
      {
        return;
      }

      foreach (var lr in expiredRequests)
      {
        lr.Status = LearningRequestStatus.ScheduleExpired;
        lr.UpdatedAt = now;
      }

      await db.SaveChangesAsync(ct);

      _logger.LogInformation(
        "ScheduleExpiryBackgroundService expired {Count} LearningRequests at {Time}",
        expiredRequests.Count, now);

      foreach (var lr in expiredRequests)
      {
        var studentUserId = lr.StudentId;
        var tutorUserId = lr.Tutor.UserId;

        await notificationService.SendToMultipleAsync(
          new[] { studentUserId, tutorUserId },
          "Yêu cầu học tập đã hết hạn",
          $"Yêu cầu học tập #{lr.Id} đã hết hạn do không có phản hồi lịch học trong thời gian quy định.",
          NotificationType.LearningRequestScheduleExpired,
          "LearningRequest",
          lr.Id,
          $"/learning-requests/{lr.Id}");
      }
    }
  }
}
