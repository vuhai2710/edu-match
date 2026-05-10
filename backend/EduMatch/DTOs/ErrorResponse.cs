using System.Text.Json.Serialization;

namespace EduMatch.DTOs
{
  public sealed class ErrorResponse
  {
    public bool Success { get; init; } = false;
    public string Message { get; init; } = string.Empty;

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ErrorCode { get; init; }

    public static ErrorResponse Create(string message, string? errorCode = null) =>
      new()
      {
        Message = message,
        ErrorCode = errorCode
      };
  }
}
