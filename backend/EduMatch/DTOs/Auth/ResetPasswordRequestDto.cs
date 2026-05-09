using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Auth
{
  public class ResetPasswordRequestDto
  {
    [Required(ErrorMessage = "Token không được trống")]
    public string Token { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu không được trống")]
    [MinLength(6, ErrorMessage = "Mật khẩu tối thiểu 6 ký tự")]
    public string NewPassword { get; set; } = string.Empty;
  }
}
