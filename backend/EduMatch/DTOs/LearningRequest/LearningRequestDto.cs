using EduMatch.Common.Enums;

namespace EduMatch.DTOs.LearningRequests
{
  public class LearningRequestDto
  {
    public long Id { get; set; }
    public long StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public long TutorProfileId { get; set; }
    public string TutorName { get; set; } = string.Empty;
    public long SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public string? Note { get; set; }
    public List<TimeSlotDto> TimeSlots { get; set; } = [];
    public DateTime DesiredStartDate { get; set; }
    public decimal HoursPerSession { get; set; }
    public decimal BudgetPerHour { get; set; }
    public decimal CalculatedDepositAmount { get; set; }
    public DateTime ScheduleExpiresAt { get; set; }
    public DateTime? PaymentExpiresAt { get; set; }
    public LearningRequestStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
  }
}
