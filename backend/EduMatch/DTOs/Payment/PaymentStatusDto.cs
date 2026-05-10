using EduMatch.Common.Enums;

namespace EduMatch.DTOs.Payment
{
    public class PaymentStatusDto
    {
        public PaymentStatus Status { get; set; }
        public long OrderCode { get; set; }
    }
}