using System.ComponentModel.DataAnnotations;
using EduMatch.DTOs.LearningRequests;

namespace EduMatch.DTOs.ScheduleProposals
{
  public class CreateScheduleProposalDto
  {
    [Required]
    public long LearningRequestId { get; set; }

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
    public decimal HourlyRate { get; set; }
  }
}
