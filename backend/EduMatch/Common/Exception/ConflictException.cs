namespace EduMatch.Common.Exception
{
  public class ConflictException : AppException
  {
    public ConflictException(string message, string? errorCode = "CONFLICT")
      : base(message, StatusCodes.Status409Conflict, errorCode)
    {
    }
  }
}
