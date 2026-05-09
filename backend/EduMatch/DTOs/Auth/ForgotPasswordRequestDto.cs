using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Auth
{
  public class ForgotPasswordRequestDto
  {
    [Required(ErrorMessage = "Email không được trống")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ")]
    public string Email { get; set; } = string.Empty;
  }
}
