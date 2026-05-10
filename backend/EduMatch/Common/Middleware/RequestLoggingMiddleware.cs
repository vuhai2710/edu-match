using System.Diagnostics;
using System.Security.Claims;

namespace EduMatch.Common.Middleware
{
  public class RequestLoggingMiddleware
  {
    private static readonly TimeSpan SlowRequestThreshold = TimeSpan.FromMilliseconds(500);
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
      _next = next;
      _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
      var startedAt = Stopwatch.GetTimestamp();

      try
      {
        await _next(context);
      }
      finally
      {
        var elapsed = Stopwatch.GetElapsedTime(startedAt);
        if (elapsed > SlowRequestThreshold)
        {
          _logger.LogWarning(
            "Slow request: [{Method}] {Path} by {User} completed in {DurationMs} ms with status {StatusCode}",
            context.Request.Method,
            context.Request.Path,
            ResolveUser(context.User),
            Math.Round(elapsed.TotalMilliseconds, 2),
            context.Response.StatusCode);
        }
      }
    }

    private static string ResolveUser(ClaimsPrincipal user)
    {
      if (user.Identity?.IsAuthenticated != true)
      {
        return "anonymous";
      }

      return user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? user.FindFirstValue("sub")
        ?? user.Identity?.Name
        ?? "authenticated-user";
    }
  }
}
