using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Applications
{
  public class AdminMatchRequestDto
  {
    [Required]
    public long TutorId { get; set; }

    [Required]
    [Range(0, double.MaxValue)]
    public decimal DepositAmount { get; set; }
  }
}
