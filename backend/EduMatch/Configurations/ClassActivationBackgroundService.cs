using EduMatch.Common.Enums;
using EduMatch.Data;
using EduMatch.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduMatch.Configurations
{
  public class ClassActivationBackgroundService : BackgroundService
  {
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ClassActivationBackgroundService> _logger;
    private readonly TimeSpan _interval;

    public ClassActivationBackgroundService(
      IServiceScopeFactory scopeFactory,
      ILogger<ClassActivationBackgroundService> logger,
      IOptions<BackgroundJobSettings> options)
    {
      _scopeFactory = scopeFactory;
      _logger = logger;
      _interval = TimeSpan.FromSeconds(options.Value.ClassActivationIntervalSeconds);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
      _logger.LogInformation(
        "ClassActivationBackgroundService started with interval {Interval}s",
        _interval.TotalSeconds);

      while (!stoppingToken.IsCancellationRequested)
      {
        try
        {
          await ProcessClassActivationsAsync(stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
          break;
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "ClassActivationBackgroundService encountered an error");
        }

        await Task.Delay(_interval, stoppingToken);
      }
    }

    private async Task ProcessClassActivationsAsync(CancellationToken ct)
    {
      using var scope = _scopeFactory.CreateScope();
      var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
      var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

      var today = DateTime.UtcNow.Date;

      var classesToActivate = await db.Classes
        .Include(c => c.Tutor)
        .Where(c => c.Status == ClassStatus.PendingStart
          && c.StartDate.HasValue
          && c.StartDate.Value.Date <= today)
        .ToListAsync(ct);

      if (classesToActivate.Count == 0)
      {
        return;
      }

      var now = DateTime.UtcNow;

      foreach (var cls in classesToActivate)
      {
        cls.Status = ClassStatus.Active;
        cls.UpdatedAt = now;
      }

      await db.SaveChangesAsync(ct);

      _logger.LogInformation(
        "ClassActivationBackgroundService activated {Count} Classes at {Time}",
        classesToActivate.Count, now);

      foreach (var cls in classesToActivate)
      {
        var studentUserId = cls.StudentId;
        var tutorUserId = cls.Tutor.UserId;

        await notificationService.SendToMultipleAsync(
          new[] { studentUserId, tutorUserId },
          "Lớp học đã bắt đầu",
          $"Lớp học {cls.Code} đã chính thức bắt đầu. Chúc bạn học tập / giảng dạy hiệu quả!",
          NotificationType.ClassActivated,
          "Class",
          cls.Id,
          $"/classes/{cls.Id}");
      }
    }
  }
}
