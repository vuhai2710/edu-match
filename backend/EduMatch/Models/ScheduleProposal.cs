using EduMatch.Common.Enums;

namespace EduMatch.Models
{
  public class ScheduleProposal : BaseEntity
  {
    public long LearningRequestId { get; set; }
    public long ProposedBy { get; set; }
    public int RoundNumber { get; set; }
    public string TimeSlots { get; set; } = null!;
    public DateTime DesiredStartDate { get; set; }
    public decimal HoursPerSession { get; set; }
    public decimal HourlyRate { get; set; }
    public decimal CalculatedDepositAmount { get; set; }
    public ScheduleProposalStatus Status { get; set; } = ScheduleProposalStatus.Pending;

    public LearningRequest LearningRequest { get; set; } = null!;
    public Tutor Tutor { get; set; } = null!;
  }
}
