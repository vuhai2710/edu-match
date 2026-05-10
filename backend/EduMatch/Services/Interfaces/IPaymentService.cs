using EduMatch.Common.Enums;
using EduMatch.DTOs;
using EduMatch.DTOs.Payment;
using EduMatch.Models;

namespace EduMatch.Services.Interfaces
{
    public interface IPaymentService
    {
        Task<PaymentResponseDto> CreatePaymentAsync(long tutorId, CreatePaymentRequestDto dto);
        Task HandleWebhookAsync(PayOSWebhookDto dto);
        Task<PaymentStatusDto> GetStatusAsync(long orderCode);
        Task<PagedResult<Payment>> GetPagedAsync(int page, int pageSize, PaymentStatus? status);
        Task<Payment?> GetByIdAsync(long id);
    }
}