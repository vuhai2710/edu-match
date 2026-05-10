using EduMatch.Common.Enums;
using EduMatch.DTOs;
using EduMatch.DTOs.Payment;

namespace EduMatch.Services.Interfaces
{
    public interface IPaymentService
    {
        Task<PaymentResponseDto> CreatePaymentAsync(long tutorId, CreatePaymentRequestDto dto);
        Task HandleWebhookAsync(PayOSWebhookDto dto);
        Task<PaymentStatusDto> GetStatusAsync(long orderCode);
        Task<PagedResult<PaymentAdminDto>> GetPagedAsync(int page, int pageSize, PaymentStatus? status);
        Task<PaymentAdminDto?> GetByIdAsync(long id);
    }
}
