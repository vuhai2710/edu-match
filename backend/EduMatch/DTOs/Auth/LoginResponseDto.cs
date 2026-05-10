using EduMatch.DTOs.User;

namespace EduMatch.DTOs.Auth
{
  public class LoginResponseDto
  {
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public UserDto User { get; set; } = default!;
  }
}
