using EduMatch.Common.Enums;
using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Auth
{
  public class RegisterDto
  {
    [Required(ErrorMessage = "Họ tên không được để trống")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email không được để trống")]
    [RegularExpression(@"^[a-zA-Z0-9._%+-]+@gmail\.com$", ErrorMessage = "Email phải đúng định dạng @gmail.com")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu không được để trống")]
    [MinLength(6, ErrorMessage = "Mật khẩu tối thiểu 6 ký tự")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Số điện thoại không được để trống")]
    [RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số")]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Giới tính không được để trống")]
    public Gender? Gender { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "ProvinceId phải lớn hơn 0")]
    public int ProvinceId { get; set; }

    [Required(ErrorMessage = "ProvinceName không được để trống")]
    public string ProvinceName { get; set; } = string.Empty;

    [Required(ErrorMessage = "WardCode không được để trống")]
    public string WardCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "WardName không được để trống")]
    public string WardName { get; set; } = string.Empty;

    public string? AddressDetail { get; set; }
  }
}
