using EduMatch.Common.Enums;

namespace EduMatch.Models
{
  public class Payment : BaseEntity
  {
    public long? LearningRequestId { get; set; }
    public LearningRequest? LearningRequest { get; set; }

    public long? PaidByUserId { get; set; }
    public User? PaidByUser { get; set; }

    public long? TutorId { get; set; }
    public Tutor? Tutor { get; set; }

    public long? ClassId { get; set; }
    public Class? Class { get; set; }

    public long OrderCode { get; set; }
    public decimal Amount { get; set; }
    public string Description { get; set; } = default!;

    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string? CheckoutUrl { get; set; }
    public string? TransactionId { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? RawWebhookData { get; set; }
  }
}