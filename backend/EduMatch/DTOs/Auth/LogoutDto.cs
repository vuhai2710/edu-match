using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Auth
{
  public class LogoutDto
  {
    [Required(ErrorMessage = "Refresh token không được trống")]
    public string RefreshToken { get; set; } = string.Empty;
  }
}
