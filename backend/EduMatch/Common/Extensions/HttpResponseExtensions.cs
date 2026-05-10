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
      CancellationToken cancellationToken = default)
    {
      response.StatusCode = statusCode;
      response.ContentType = "application/json";

      var body = JsonSerializer.Serialize(ErrorResponse.Create(message, errorCode), JsonOptions);
      await response.WriteAsync(body, cancellationToken);
    }
  }
}
