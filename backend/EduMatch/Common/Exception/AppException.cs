namespace EduMatch.Common.Exception
{
  public class AppException : System.Exception
  {
    public int StatusCode { get; }
    public string? ErrorCode { get; }

    public AppException(
      string message,
      int statusCode = StatusCodes.Status400BadRequest,
      string? errorCode = null,
      System.Exception? innerException = null)
      : base(message, innerException)
    {
      StatusCode = statusCode;
      ErrorCode = errorCode;
    }
  }
}
