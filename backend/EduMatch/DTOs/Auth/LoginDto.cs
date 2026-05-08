using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Auth
{
  public class LoginDto
  {
    [Required(ErrorMessage = "Email không được trống")]
    [RegularExpression(@"^[a-zA-Z0-9._%+-]+@gmail\.com$", ErrorMessage = "Email phải đúng định dạng @gmail.com")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu không được trống")]
    public string Password { get; set; } = string.Empty;
  }
}
