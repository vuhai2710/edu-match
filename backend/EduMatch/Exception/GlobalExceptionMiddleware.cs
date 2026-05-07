using System.Text.Json;
using EduMatch.DTOs;

namespace EduMatch.Exception
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
      catch (AppException ex)
      {
        _logger.LogWarning("AppException [{StatusCode}]: {Message}", ex.StatusCode, ex.Message);
        await WriteResponse(context, ex.StatusCode, ex.Message);
      }
      catch (System.Exception ex)
      {
        _logger.LogError(ex, "Unhandled exception");
        await WriteResponse(context, 500, "Lỗi hệ thống, vui lòng thử lại");
      }
    }

    private static async Task WriteResponse(HttpContext context, int statusCode, string message)
    {
      context.Response.StatusCode = statusCode;
      context.Response.ContentType = "application/json";

      var body = JsonSerializer.Serialize(
        ApiResponse.Fail(message),
        new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }
      );

      await context.Response.WriteAsync(body);
    }
  }
}
