using EduMatch.Common.Enums;
using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Auth
{
  public class RegisterDto
  {
    [Required(ErrorMessage = "Ho ten khong duoc de trong")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email khong duoc de trong")]
    [RegularExpression(@"^[a-zA-Z0-9._%+-]+@gmail\.com$", ErrorMessage = "Email phai dung dinh dang example@gmail.com")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mat khau khong duoc de trong")]
    [MinLength(6, ErrorMessage = "Mat khau toi thieu 6 ky tu")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "So dien thoai khong duoc de trong")]
    [RegularExpression(@"^0\d{9}$", ErrorMessage = "So dien thoai phai bat dau bang 0 va co dung 10 chu so")]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Gioi tinh khong duoc de trong")]
    public Gender? Gender { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "ProvinceId phai lon hon 0")]
    public int ProvinceId { get; set; }

    [Required(ErrorMessage = "ProvinceName khong duoc de trong")]
    public string ProvinceName { get; set; } = string.Empty;

    [Required(ErrorMessage = "WardCode khong duoc de trong")]
    public string WardCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "WardName khong duoc de trong")]
    public string WardName { get; set; } = string.Empty;

    public string? AddressDetail { get; set; }
  }
}
