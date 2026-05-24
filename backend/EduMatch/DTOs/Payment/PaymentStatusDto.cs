using EduMatch.Common.Enums;

namespace EduMatch.DTOs.Payment
{
  public class PaymentStatusDto
  {
    public long OrderCode { get; set; }
    public long? LearningRequestId { get; set; }
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; }
    public DateTime? PaidAt { get; set; }
  }
}