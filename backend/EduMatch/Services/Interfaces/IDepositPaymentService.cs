using EduMatch.Common.Enums;
using EduMatch.DTOs;
using EduMatch.DTOs.Payment;

namespace EduMatch.Services.Interfaces
{
  public interface IDepositPaymentService
  {
    Task<ApiResponse<PaymentResponseDto>> CreateDepositAsync(long callerUserId, CreateDepositPaymentRequest dto);
    Task<ApiResponse<DepositPaymentDto?>> GetByLearningRequestAsync(long callerUserId, bool isAdmin, long learningRequestId);
    Task HandleWebhookAsync(PayOSWebhookDto dto);
    Task<ApiResponse<PaymentStatusDto>> GetStatusAsync(long orderCode);
    Task<ApiResponse<PagedResult<PaymentAdminDto>>> GetMyPaymentsAsync(long userId, int page, int pageSize, PaymentStatus? status);
    Task<ApiResponse<PaymentAdminDto>> GetMyPaymentByIdAsync(long userId, long id);
  }
}
