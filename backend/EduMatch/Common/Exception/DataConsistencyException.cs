namespace EduMatch.Common.Exception
{
  public sealed class DataConsistencyException : AppException
  {
    public DataConsistencyException(
      string message = "Dữ liệu nội bộ không nhất quán.",
      string? errorCode = "DATA_INTEGRITY_ERROR",
      System.Exception? innerException = null)
      : base(message, StatusCodes.Status500InternalServerError, errorCode, innerException)
    {
    }
  }
}
