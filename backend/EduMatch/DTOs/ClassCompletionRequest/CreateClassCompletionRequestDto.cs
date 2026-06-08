using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.ClassCompletionRequests;

public class CreateClassCompletionRequestDto
{
  [Required]
  public long ClassId { get; set; }
}
