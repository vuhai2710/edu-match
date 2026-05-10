namespace EduMatch.Common.Exception
{
  public class UnauthorizedException : UnauthorizedAccessException
  {
    public UnauthorizedException(string message = "Phiên đăng nhập hết hạn")
      : base(message)
    {
    }
  }
}
