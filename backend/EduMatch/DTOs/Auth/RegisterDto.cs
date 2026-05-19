using EduMatch.Common.Enums;
using EduMatch.DTOs.Address;
using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Auth
{
  public class RegisterDto
  {
    [Required(ErrorMessage = "Họ tên không được để trống")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email không được để trống")]
    [RegularExpression(@"^[a-zA-Z0-9._%+-]+@gmail\.com$", ErrorMessage = "Email phải đúng định dạng example@gmail.com")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu không được để trống")]
    [MinLength(6, ErrorMessage = "Mật khẩu tối thiểu 6 ký tự")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Số điện thoại không được để trống")]
    [RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số")]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Giới tính không được để trống")]
    public Gender? Gender { get; set; }

    [Required(ErrorMessage = "Địa chỉ không được để trống")]
    public CreateAddressDto? Address { get; set; }
  }
}
