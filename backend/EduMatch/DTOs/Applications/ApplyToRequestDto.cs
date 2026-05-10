using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Applications
{
  public class ApplyToRequestDto
  {
    [MaxLength(1000)]
    public string? Message { get; set; }
  }
}
