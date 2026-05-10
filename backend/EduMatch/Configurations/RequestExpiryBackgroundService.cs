using EduMatch.Common.Enums;
using EduMatch.Repositories.Interfaces;

namespace EduMatch.Configuration
{
  public class RequestExpiryBackgroundService : BackgroundService
  {
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RequestExpiryBackgroundService> _logger;

    public RequestExpiryBackgroundService(IServiceScopeFactory scopeFactory, ILogger<RequestExpiryBackgroundService> logger)
    {
      _scopeFactory = scopeFactory;
      _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
      while (!stoppingToken.IsCancellationRequested)
      {
        try
        {
          using var scope = _scopeFactory.CreateScope();
          var repository = scope.ServiceProvider.GetRequiredService<ITutorRequestRepository>();

          var expiredRequests = await repository.GetExpiredOpenRequestsAsync();
          foreach (var request in expiredRequests)
          {
            request.Status = TutorRequestStatus.Expired;
          }

          if (expiredRequests.Count > 0)
          {
            await repository.SaveChangesAsync();
          }

          _logger.LogInformation("Expired {count} requests", expiredRequests.Count);
          _logger.LogInformation("Auto-expired {Count} TutorRequests at {Time}", expiredRequests.Count, DateTime.UtcNow);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
          break;
        }
        catch (System.Exception ex)
        {
          _logger.LogError(ex, "Failed while expiring tutor requests");
        }

        await Task.Delay(Interval, stoppingToken);
      }
    }
  }
}
