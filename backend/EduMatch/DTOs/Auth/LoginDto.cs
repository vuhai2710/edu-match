using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Auth
{
  public class LoginDto
  {
    [Required(ErrorMessage = "Email không được trống")]
    [EmailAddress(ErrorMessage = "Email không đúng định dạng")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu không được trống")]
    public string Password { get; set; } = string.Empty;
  }
}
