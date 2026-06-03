using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Applications
{
  public class ApplyToRequestDto
  {
    [MaxLength(1000, ErrorMessage = "Tin nhắn ứng tuyển không được vượt quá 1000 ký tự.")]
    public string? Message { get; set; }
  }
}
