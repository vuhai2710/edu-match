namespace EduMatch.DTOs.Auth
{
  public class AuthResponseDto
  {
    public string AccessToken { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public long UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
  }
}
