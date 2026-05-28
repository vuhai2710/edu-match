using EduMatch.DTOs;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace EduMatch.Common.Extensions
{
  public static class HttpResponseExtensions
  {
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
      DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public static async Task WriteErrorResponseAsync(
      this HttpResponse response,
      int statusCode,
      string message,
      string? errorCode = null,
      IReadOnlyDictionary<string, string[]>? errors = null,
      CancellationToken cancellationToken = default)
    {
      response.StatusCode = statusCode;
      response.ContentType = "application/json";

      var body = JsonSerializer.Serialize(
        ErrorResponse.Create(
          message,
          statusCode,
          errorCode,
          response.HttpContext.TraceIdentifier,
          errors),
        JsonOptions);
      if (cancellationToken.IsCancellationRequested)
      {
        return;
      }

      try
      {
        await response.WriteAsync(body, cancellationToken);
      }
      catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
      {
      }
    }

    public static async Task WriteApiResponseAsync(
      this HttpResponse response,
      ApiResponse payload,
      int statusCode = StatusCodes.Status200OK,
      CancellationToken cancellationToken = default)
    {
      response.StatusCode = statusCode;
      response.ContentType = "application/json";

      var body = JsonSerializer.Serialize(payload, JsonOptions);
      if (cancellationToken.IsCancellationRequested)
      {
        return;
      }

      try
      {
        await response.WriteAsync(body, cancellationToken);
      }
      catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
      {
      }
    }
  }
}
