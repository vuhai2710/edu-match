namespace EduMatch.Common.Exception
{
  public sealed record ExceptionDescriptor(
    int StatusCode,
    string Message,
    string? ErrorCode = null,
    IReadOnlyDictionary<string, string[]>? Errors = null);
}
