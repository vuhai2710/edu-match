using EduMatch.Common.Extensions;

namespace EduMatch.Common.Exception
{
  public class GlobalExceptionMiddleware
  {
    private const string DefaultNotFoundMessage = "Không tìm thấy dữ liệu";
    private const string DefaultForbiddenMessage = "Bạn không có quyền thực hiện thao tác này";
    private const string DefaultUnauthorizedMessage = "Phiên đăng nhập hết hạn";
    private const string DefaultSystemErrorMessage = "Lỗi hệ thống, vui lòng thử lại";
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

        var error = MapException(exception);
        LogException(context, error, exception);

        await context.Response.WriteErrorResponseAsync(
          error.StatusCode,
          error.Message,
          error.ErrorCode,
          context.RequestAborted);
      }
    }

    private void LogException(HttpContext context, ErrorDescriptor error, System.Exception exception)
    {
      if (error.StatusCode >= StatusCodes.Status500InternalServerError)
      {
        _logger.LogError(
          exception,
          "[{Method}] {Path} → {StatusCode}: {Message}",
          context.Request.Method,
          context.Request.Path,
          error.StatusCode,
          error.Message);

        return;
      }

      _logger.LogWarning(
        "[{Method}] {Path} → {StatusCode}: {Message}",
        context.Request.Method,
        context.Request.Path,
        error.StatusCode,
        error.Message);
    }

    private static ErrorDescriptor MapException(System.Exception exception)
    {
      return exception switch
      {
        NotFoundException notFoundException => new(
          StatusCodes.Status404NotFound,
          DefaultNotFoundMessage,
          notFoundException.ErrorCode),

        ConflictException conflictException => new(
          StatusCodes.Status409Conflict,
          conflictException.Message,
          conflictException.ErrorCode),

        ForbiddenException forbiddenException => new(
          StatusCodes.Status403Forbidden,
          DefaultForbiddenMessage,
          forbiddenException.ErrorCode),

        ValidationException validationException => new(
          StatusCodes.Status400BadRequest,
          BuildValidationMessage(validationException),
          validationException.ErrorCode),

        UnauthorizedAccessException => new(
          StatusCodes.Status401Unauthorized,
          DefaultUnauthorizedMessage,
          "UNAUTHORIZED"),

        AppException appException => new(
          appException.StatusCode,
          appException.Message,
          appException.ErrorCode),

        _ => new(
          StatusCodes.Status500InternalServerError,
          DefaultSystemErrorMessage,
          "INTERNAL_SERVER_ERROR")
      };
    }

    private static string BuildValidationMessage(ValidationException exception)
    {
      var messages = exception.Errors
        .SelectMany(entry => entry.Value.Select(error =>
          string.IsNullOrWhiteSpace(entry.Key)
            ? error
            : $"{entry.Key}: {error}"))
        .Where(message => !string.IsNullOrWhiteSpace(message))
        .ToArray();

      if (messages.Length > 0)
      {
        return string.Join("; ", messages);
      }

      return string.IsNullOrWhiteSpace(exception.Message)
        ? "Dữ liệu không hợp lệ."
        : exception.Message;
    }

    private sealed record ErrorDescriptor(int StatusCode, string Message, string? ErrorCode);
  }
}
