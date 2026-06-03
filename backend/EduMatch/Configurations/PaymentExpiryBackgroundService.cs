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
      var depositPaymentService = scope.ServiceProvider.GetRequiredService<IDepositPaymentService>();
      var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

      var now = DateTime.UtcNow;

      await SyncActivePendingPaymentsAsync(db, depositPaymentService, now, ct);

      var expiredRequests = await db.LearningRequests
        .Include(lr => lr.Tutor)
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
        var tutorUserId = lr.Tutor.UserId;

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

    private async Task SyncActivePendingPaymentsAsync(
      AppDbContext db,
      IDepositPaymentService depositPaymentService,
      DateTime now,
      CancellationToken ct)
    {
      var activePendingOrderCodes = await db.Payments
        .Where(p => p.Status == PaymentStatus.Pending
          && p.LearningRequestId.HasValue
          && p.LearningRequest != null
          && p.LearningRequest.Status == LearningRequestStatus.SoftBooked
          && (!p.LearningRequest.PaymentExpiresAt.HasValue
              || p.LearningRequest.PaymentExpiresAt.Value >= now))
        .Select(p => p.OrderCode)
        .ToListAsync(ct);

      if (activePendingOrderCodes.Count == 0)
      {
        return;
      }

      _logger.LogInformation(
        "PaymentExpiryBackgroundService reconciling {Count} active pending payments with PayOS",
        activePendingOrderCodes.Count);

      foreach (var orderCode in activePendingOrderCodes)
      {
        ct.ThrowIfCancellationRequested();

        var result = await depositPaymentService.GetStatusAsync(orderCode);
        if (!result.Success)
        {
          _logger.LogWarning(
            "Pending payment reconciliation failed for order {OrderCode}. StatusCode={StatusCode}, Message={Message}",
            orderCode,
            result.StatusCode,
            result.Message);
        }
      }
    }
  }
}
