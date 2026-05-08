using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Auth
{
  public class RegisterDto
  {
    [Required(ErrorMessage = "Họ tên không được trống")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email không được trống")]
    [RegularExpression(@"^[a-zA-Z0-9._%+-]+@gmail\.com$", ErrorMessage = "Email phải đúng định dạng @gmail.com")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu không được trống")]
    [MinLength(6, ErrorMessage = "Mật khẩu tối thiểu 6 ký tự")]
    public string Password { get; set; } = string.Empty;

    [RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số")]
    public string? PhoneNumber { get; set; }
  }
}
