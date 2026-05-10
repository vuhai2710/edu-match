namespace EduMatch.Common.Exception
{
  public class ForbiddenException : AppException
  {
    public ForbiddenException(
      string message = "Bạn không có quyền thực hiện thao tác này",
      string? errorCode = "FORBIDDEN")
      : base(message, StatusCodes.Status403Forbidden, errorCode)
    {
    }
  }
}
