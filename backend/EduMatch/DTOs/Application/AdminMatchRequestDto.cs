using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Applications
{
  public class AdminMatchRequestDto
  {
    [Required]
    public long TutorProfileId { get; set; }
  }
}
