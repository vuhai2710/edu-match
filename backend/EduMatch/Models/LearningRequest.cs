using EduMatch.Common.Enums;

namespace EduMatch.Models
{
  public class LearningRequest : BaseEntity
  {
    public long StudentId { get; set; }
    public long TutorProfileId { get; set; }
    public long SubjectId { get; set; }
    public string? Note { get; set; }
    public string TimeSlots { get; set; } = null!;
    public DateTime DesiredStartDate { get; set; }
    public decimal HoursPerSession { get; set; }
    public decimal BudgetPerHour { get; set; }
    public decimal CalculatedDepositAmount { get; set; }
    public DateTime ScheduleExpiresAt { get; set; }
    public DateTime? PaymentExpiresAt { get; set; }
    public LearningRequestStatus Status { get; set; } = LearningRequestStatus.Pending;

    public User Student { get; set; } = null!;
    public Tutor TutorProfile { get; set; } = null!;
    public Subject Subject { get; set; } = null!;
    public ScheduleProposal? ScheduleProposal { get; set; }
  }
}
