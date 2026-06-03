using EduMatch.Common.Enums;
using EduMatch.DTOs.LearningRequests;

namespace EduMatch.DTOs.Classes;

public class ClassDto
{
  public long Id { get; set; }
  public string Code { get; set; } = string.Empty;
  public long StudentId { get; set; }
  public string StudentName { get; set; } = string.Empty;
  public long TutorId { get; set; }
  public string TutorName { get; set; } = string.Empty;
  public long? SubjectId { get; set; }
  public string SubjectName { get; set; } = string.Empty;
  public DateTime? StartDate { get; set; }
  public DateTime? EndDate { get; set; }
  public List<TimeSlotDto> TimeSlots { get; set; } = [];
  public AcceptedScheduleSource? AcceptedScheduleSource { get; set; }
  public decimal? DepositAmountSnapshot { get; set; }
  public ClassStatus Status { get; set; }
  public ClassPaymentSummaryDto? PaymentSummary { get; set; }
  public DateTime CreatedAt { get; set; }
}
