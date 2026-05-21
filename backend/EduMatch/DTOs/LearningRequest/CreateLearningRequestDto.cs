using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.LearningRequests
{
  public class CreateLearningRequestDto
  {
    [Required]
    public long TutorProfileId { get; set; }

    [Required]
    public long SubjectId { get; set; }

    [MaxLength(1000)]
    public string? Note { get; set; }

    [Required]
    [MinLength(1)]
    public List<TimeSlotInputDto> TimeSlots { get; set; } = [];

    [Required]
    public DateTime DesiredStartDate { get; set; }

    [Required]
    [Range(0.5, 3.0)]
    public decimal HoursPerSession { get; set; }

    [Required]
    [Range(0.01, 10000000)]
    public decimal BudgetPerHour { get; set; }
  }

  public class TimeSlotInputDto
  {
    [Required]
    public string Day { get; set; } = string.Empty;

    [Required]
    public string StartTime { get; set; } = string.Empty;

    [Required]
    public string EndTime { get; set; } = string.Empty;
  }
}
