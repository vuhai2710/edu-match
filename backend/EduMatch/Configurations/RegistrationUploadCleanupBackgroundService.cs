using EduMatch.Services.Interfaces;

namespace EduMatch.Configurations
{
  public class RegistrationUploadCleanupBackgroundService : BackgroundService
  {
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RegistrationUploadCleanupBackgroundService> _logger;

    public RegistrationUploadCleanupBackgroundService(
      IServiceScopeFactory scopeFactory,
      ILogger<RegistrationUploadCleanupBackgroundService> logger)
    {
      _scopeFactory = scopeFactory;
      _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
      using var timer = new PeriodicTimer(Interval);
      while (!stoppingToken.IsCancellationRequested)
      {
        await CleanupAsync(stoppingToken);
        try
        {
          await timer.WaitForNextTickAsync(stoppingToken);
        }
        catch (OperationCanceledException)
        {
          break;
        }
      }
    }

    private async Task CleanupAsync(CancellationToken cancellationToken)
    {
      try
      {
        using var scope = _scopeFactory.CreateScope();
        var fileService = scope.ServiceProvider.GetRequiredService<IFileService>();
        var updated = await fileService.CleanupExpiredRegistrationUploadsAsync(DateTime.UtcNow);
        if (updated > 0)
        {
          _logger.LogInformation("Cleaned up {Count} expired registration uploads", updated);
        }
      }
      catch (Exception ex) when (ex is not OperationCanceledException || !cancellationToken.IsCancellationRequested)
      {
        _logger.LogWarning(ex, "Failed to clean up expired registration uploads");
      }
    }
  }
}
