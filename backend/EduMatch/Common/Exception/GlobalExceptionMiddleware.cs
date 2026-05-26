using EduMatch.Common.Extensions;

namespace EduMatch.Common.Exception
{
  public class GlobalExceptionMiddleware
  {
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
      _next = next;
      _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
      try
      {
        await _next(context);
      }
      catch (OperationCanceledException exception) when (context.RequestAborted.IsCancellationRequested)
      {
        _logger.LogDebug(
          exception,
          "Request was canceled by the client for [{Method}] {Path}",
          context.Request.Method,
          context.Request.Path);
      }
      catch (System.Exception exception)
      {
        if (context.Response.HasStarted)
        {
          _logger.LogError(
            exception,
            "Cannot handle exception because the response has already started for [{Method}] {Path}",
            context.Request.Method,
            context.Request.Path);

          throw;
        }

        var error = ExceptionMapper.Map(exception);
        LogException(context, error, exception);

        await context.Response.WriteErrorResponseAsync(
          error.StatusCode,
          error.Message,
          error.ErrorCode,
          error.Errors,
          context.RequestAborted);
      }
    }

    private void LogException(HttpContext context, ExceptionDescriptor error, System.Exception exception)
    {
      if (error.StatusCode >= StatusCodes.Status500InternalServerError)
      {
        _logger.LogError(
          exception,
          "[{Method}] {Path} -> {StatusCode}: {Message}",
          context.Request.Method,
          context.Request.Path,
          error.StatusCode,
          error.Message);

        return;
      }

      _logger.LogWarning(
        exception,
        "[{Method}] {Path} -> {StatusCode}: {Message}",
        context.Request.Method,
        context.Request.Path,
        error.StatusCode,
        error.Message);
    }
  }
}
