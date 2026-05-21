using EduMatch.DTOs.Payment;

namespace EduMatch.Services.Interfaces
{
  public interface IDepositPaymentService
  {
    Task<PaymentResponseDto> CreateDepositAsync(long callerUserId, CreateDepositPaymentRequest dto);
    Task HandleWebhookAsync(PayOSWebhookDto dto);
    Task<PaymentStatusDto> GetStatusAsync(long orderCode);
  }
}
