using EduMatch.Common.Enums;
using EduMatch.DTOs;
using EduMatch.DTOs.Payment;

namespace EduMatch.Services.Interfaces
{
    [Obsolete("Legacy payment service. Use IDepositPaymentService for v2 deposit booking flow.")]
    public interface IPaymentService
    {
        Task<PaymentResponseDto> CreatePaymentAsync(long tutorId, CreatePaymentRequestDto dto);
        Task HandleWebhookAsync(PayOSWebhookDto dto);
        Task<PaymentStatusDto> GetStatusAsync(long orderCode);
        Task<PagedResult<PaymentAdminDto>> GetPagedAsync(int page, int pageSize, PaymentStatus? status, DateTime? fromDate, DateTime? toDate);
        Task<PaymentAdminDto?> GetByIdAsync(long id);
    }
}
