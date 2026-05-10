using EduMatch.Common.Enums;

namespace EduMatch.DTOs.Payment
{
    public class PaymentResponseDto
    {
        public long OrderCode { get; set; }
        public string CheckoutUrl { get; set; } = default!;
        public PaymentStatus Status { get; set; }
    }
}