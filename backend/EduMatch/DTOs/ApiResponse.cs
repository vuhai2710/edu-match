namespace EduMatch.DTOs
{
  public class ApiResponse
  {
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int? StatusCode { get; set; }

    public static ApiResponse Fail(string message, int? statusCode = null) =>
      new() { Success = false, Message = message, StatusCode = statusCode };

    public static ApiResponse Ok(string message = "", int? statusCode = null) =>
      new() { Success = true, Message = message, StatusCode = statusCode };
  }

  public class ApiResponse<T> : ApiResponse
  {
    public T? Data { get; set; }
    public static ApiResponse<T> SuccessResult(T data, string message = "", int? statusCode = null) =>
      new() { Success = true, Data = data, Message = message, StatusCode = statusCode };
  }
}


