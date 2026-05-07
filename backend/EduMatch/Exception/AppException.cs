namespace EduMatch.Exception
{
  public class AppException : System.Exception
  {
    public int StatusCode { get; }

    public AppException(string message, int statusCode = 400)
      : base(message)
    {
      StatusCode = statusCode;
    }
  }
}
