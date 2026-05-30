using System.Text.Json.Serialization;

namespace EduMatch.DTOs
{
  public sealed class ErrorResponse
  {
    public bool Success { get; init; } = false;
    public string Message { get; init; } = string.Empty;
    public int StatusCode { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ErrorCode { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? TraceId { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyDictionary<string, string[]>? Errors { get; init; }

    public static ErrorResponse Create(
      string message,
      int statusCode,
      string? errorCode = null,
      string? traceId = null,
      IReadOnlyDictionary<string, string[]>? errors = null) =>
      new()
      {
        Message = message,
        StatusCode = statusCode,
        ErrorCode = errorCode,
        TraceId = traceId,
        Errors = errors is { Count: > 0 } ? errors : null
      };
  }
}
