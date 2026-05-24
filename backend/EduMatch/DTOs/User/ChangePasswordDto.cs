using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.User
{
  public class ChangePasswordDto
  {
    [Required(ErrorMessage = "Mật khẩu hiện tại không được trống")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu mới không được trống")]
    [MinLength(6, ErrorMessage = "Mật khẩu tối thiểu 6 ký tự")]
    public string NewPassword { get; set; } = string.Empty;
  }
}
