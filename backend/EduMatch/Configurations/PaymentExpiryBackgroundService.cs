using EduMatch.Common.Enums;
using EduMatch.Data;
using EduMatch.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduMatch.Configurations
{
  public class PaymentExpiryBackgroundService : BackgroundService
  {
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PaymentExpiryBackgroundService> _logger;
    private readonly TimeSpan _interval;

    public PaymentExpiryBackgroundService(
      IServiceScopeFactory scopeFactory,
      ILogger<PaymentExpiryBackgroundService> logger,
      IOptions<BackgroundJobSettings> options)
    {
      _scopeFactory = scopeFactory;
      _logger = logger;
      _interval = TimeSpan.FromSeconds(options.Value.PaymentExpiryIntervalSeconds);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
      _logger.LogInformation(
        "PaymentExpiryBackgroundService started with interval {Interval}s",
        _interval.TotalSeconds);

      while (!stoppingToken.IsCancellationRequested)
      {
        try
        {
          await ProcessExpiredPaymentsAsync(stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
          break;
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "PaymentExpiryBackgroundService encountered an error");
        }

        await Task.Delay(_interval, stoppingToken);
      }
    }

    private async Task ProcessExpiredPaymentsAsync(CancellationToken ct)
    {
      using var scope = _scopeFactory.CreateScope();
      var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
      var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

      var now = DateTime.UtcNow;

      var expiredRequests = await db.LearningRequests
        .Include(lr => lr.TutorProfile)
        .Where(lr => lr.PaymentExpiresAt.HasValue
          && lr.PaymentExpiresAt.Value < now
          && lr.Status == LearningRequestStatus.SoftBooked)
        .ToListAsync(ct);

      if (expiredRequests.Count == 0)
      {
        return;
      }

      var expiredRequestIds = expiredRequests.Select(lr => lr.Id).ToList();

      var pendingPayments = await db.Payments
        .Where(p => p.LearningRequestId.HasValue
          && expiredRequestIds.Contains(p.LearningRequestId.Value)
          && p.Status == PaymentStatus.Pending)
        .ToListAsync(ct);

      foreach (var lr in expiredRequests)
      {
        lr.Status = LearningRequestStatus.PaymentExpired;
        lr.UpdatedAt = now;
      }

      foreach (var payment in pendingPayments)
      {
        payment.Status = PaymentStatus.Cancelled;
        payment.UpdatedAt = now;
      }

      await db.SaveChangesAsync(ct);

      _logger.LogInformation(
        "PaymentExpiryBackgroundService expired {RequestCount} LearningRequests, cancelled {PaymentCount} Payments at {Time}",
        expiredRequests.Count, pendingPayments.Count, now);

      foreach (var lr in expiredRequests)
      {
        var studentUserId = lr.StudentId;
        var tutorUserId = lr.TutorProfile.UserId;

        await notificationService.SendToMultipleAsync(
          new[] { studentUserId, tutorUserId },
          "Hết hạn thanh toán đặt cọc",
          $"Yêu cầu học tập #{lr.Id} đã bị hủy do không thanh toán đặt cọc trong thời hạn quy định.",
          NotificationType.LearningRequestPaymentExpired,
          "LearningRequest",
          lr.Id,
          $"/learning-requests/{lr.Id}");
      }
    }
  }
}
