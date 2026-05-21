using EduMatch.Common.Enums;
using EduMatch.DTOs.LearningRequests;

namespace EduMatch.DTOs.ScheduleProposals
{
  public class ScheduleProposalDto
  {
    public long Id { get; set; }
    public long LearningRequestId { get; set; }
    public long StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public long TutorProfileId { get; set; }
    public string TutorName { get; set; } = string.Empty;
    public long SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public long ProposedBy { get; set; }
    public string ProposedByName { get; set; } = string.Empty;
    public int RoundNumber { get; set; }
    public List<TimeSlotDto> TimeSlots { get; set; } = [];
    public DateTime DesiredStartDate { get; set; }
    public decimal HoursPerSession { get; set; }
    public decimal HourlyRate { get; set; }
    public decimal CalculatedDepositAmount { get; set; }
    public ScheduleProposalStatus Status { get; set; }
    public LearningRequestStatus LearningRequestStatus { get; set; }
    public DateTime? PaymentExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
  }
}
