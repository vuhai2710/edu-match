using System.Text.Json.Serialization;
using EduMatch.Common.Exception;

namespace EduMatch.DTOs
{
  public sealed class HubOperationErrorResponse
  {
    public string Operation { get; init; } = string.Empty;
    public bool Success { get; init; } = false;
    public string Message { get; init; } = string.Empty;
    public int StatusCode { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ErrorCode { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? TraceId { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyDictionary<string, string[]>? Errors { get; init; }

    public static HubOperationErrorResponse Create(
      string operation,
      ExceptionDescriptor error,
      string? traceId = null)
    {
      return new HubOperationErrorResponse
      {
        Operation = operation,
        Message = error.Message,
        StatusCode = error.StatusCode,
        ErrorCode = error.ErrorCode,
        TraceId = traceId,
        Errors = error.Errors is { Count: > 0 } ? error.Errors : null
      };
    }
  }
}
