using EduMatch.Common.Enums;

namespace EduMatch.DTOs.Classes;

public class ClassPaymentSummaryDto
{
  public long PaymentId { get; set; }
  public long? PaidByUserId { get; set; }
  public string? PaidByUserName { get; set; }
  public decimal Amount { get; set; }
  public PaymentStatus Status { get; set; }
  public DateTime? PaidAt { get; set; }
}
