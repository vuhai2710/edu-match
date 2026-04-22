namespace EduMatch.DTOs
{
  public class ApiResponse
  {
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;

    public static ApiResponse Fail(string message) =>
      new() { Success = false, Message = message };

    public static ApiResponse Ok(string message = "") =>
      new() { Success = true, Message = message };
  }

  public class ApiResponse<T> : ApiResponse
  {
    public T? Data { get; set; }
    public static ApiResponse<T> SuccessResult(T data, string message = "") =>
      new() { Success = true, Data = data, Message = message };
  }
}


