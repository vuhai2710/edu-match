using EduMatch.DTOs.Payment;

namespace EduMatch.Services.Interfaces
{
  public interface IDepositPaymentService
  {
    Task<PaymentResponseDto> CreateDepositAsync(long callerUserId, CreateDepositPaymentRequest dto);
    Task<DepositPaymentDto?> GetByLearningRequestAsync(long callerUserId, bool isAdmin, long learningRequestId);
    Task HandleWebhookAsync(PayOSWebhookDto dto);
    Task<PaymentStatusDto> GetStatusAsync(long orderCode);
  }
}
