using EduMatch.Common.Enums;

namespace EduMatch.DTOs.Payment
{
    public class PaymentAdminDto
    {
        public long Id { get; set; }
        public long ClassId { get; set; }
        public long TutorId { get; set; }
        public long OrderCode { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; } = string.Empty;
        public PaymentStatus Status { get; set; }
        public string CheckoutUrl { get; set; } = string.Empty;
        public string? TransactionId { get; set; }
        public DateTime? PaidAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
