namespace EduMatch.Common.Exception
{
  public class ValidationException : AppException
  {
    public IReadOnlyDictionary<string, string[]> Errors { get; }

    public ValidationException(string message, string? errorCode = "VALIDATION_ERROR")
      : base(message, StatusCodes.Status400BadRequest, errorCode)
    {
      Errors = new Dictionary<string, string[]>();
    }

    public ValidationException(Dictionary<string, string[]> errors, string? errorCode = "VALIDATION_ERROR")
      : base("Dữ liệu không hợp lệ.", StatusCodes.Status400BadRequest, errorCode)
    {
      Errors = errors
        .Where(x => x.Value is { Length: > 0 })
        .ToDictionary(
          x => x.Key,
          x => x.Value.Where(message => !string.IsNullOrWhiteSpace(message)).ToArray(),
          StringComparer.OrdinalIgnoreCase);
    }

    public ValidationException(string message, Dictionary<string, string[]> errors, string? errorCode = "VALIDATION_ERROR")
      : base(message, StatusCodes.Status400BadRequest, errorCode)
    {
      Errors = errors
        .Where(x => x.Value is { Length: > 0 })
        .ToDictionary(
          x => x.Key,
          x => x.Value.Where(item => !string.IsNullOrWhiteSpace(item)).ToArray(),
          StringComparer.OrdinalIgnoreCase);
    }
  }
}
