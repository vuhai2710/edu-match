using System;
using EduMatch.Enums;

namespace EduMatch.Models
{
    public class Payment : BaseEntity
    {
        public long ClassId { get; set; }
        public Class Class { get; set; } = null!;

        public long TutorId { get; set; }
        public Tutor Tutor { get; set; } = null!;

        public long OrderCode { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; } = default!;
        
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
        public string CheckoutUrl { get; set; } = default!;
        public string? TransactionId { get; set; }
        public DateTime? PaidAt { get; set; }
        public string? RawWebhookData { get; set; }
    }
}