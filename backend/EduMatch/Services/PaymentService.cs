using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EduMatch.Common.Enums;
using EduMatch.Configurations;
using EduMatch.DTOs;
using EduMatch.DTOs.Payment;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace EduMatch.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IPaymentRepository _paymentRepo;
        private readonly IClassRepository _classRepo;
        private readonly INotificationService _notificationService;
        private readonly HttpClient _httpClient;
        private readonly PayOSSettings _settings;
        private readonly ILogger<PaymentService> _logger;

        public PaymentService(
            IPaymentRepository paymentRepo,
            IClassRepository classRepo,
            INotificationService notificationService,
            HttpClient httpClient,
            IOptions<PayOSSettings> options,
            ILogger<PaymentService> logger)
        {
            _paymentRepo = paymentRepo;
            _classRepo = classRepo;
            _notificationService = notificationService;
            _httpClient = httpClient;
            _settings = options.Value;
            _logger = logger;
            
            _httpClient.BaseAddress = new Uri(_settings.BaseUrl);
            _httpClient.DefaultRequestHeaders.Add("x-client-id", _settings.ClientId);
            _httpClient.DefaultRequestHeaders.Add("x-api-key", _settings.ApiKey);
        }

        public async Task<PaymentResponseDto> CreatePaymentAsync(long tutorId, CreatePaymentRequestDto dto)
        {
            var @class = await _classRepo.GetByIdAsync(dto.ClassId);
            if (@class == null || @class.TutorId != tutorId)
            {
                throw new System.Exception("Class not found or unauthorized.");
            }

            if (@class.Status != ClassStatus.PendingPayment)
            {
                throw new System.Exception("Class is not in pending payment status.");
            }

            long orderCode = long.Parse(DateTime.Now.ToString("yyMMddHHmmss") + new Random().Next(100, 999).ToString());
            string description = $"Pay deposit obj: {dto.ClassId}".Substring(0, Math.Min(25, $"Pay deposit obj: {dto.ClassId}".Length));

            var payment = new Payment
            {
                ClassId = dto.ClassId,
                TutorId = tutorId,
                Amount = @class.DepositAmount,
                OrderCode = orderCode,
                Description = description,
                Status = PaymentStatus.Pending
            };

            await _paymentRepo.AddAsync(payment);
            await _paymentRepo.SaveChangesAsync();

            var reqData = new
            {
                orderCode = orderCode,
                amount = (int)payment.Amount,
                description = description,
                cancelUrl = _settings.CancelUrl,
                returnUrl = _settings.ReturnUrl + "?orderCode=" + orderCode
            };

            string signatureData = $"amount={reqData.amount}&cancelUrl={reqData.cancelUrl}&description={reqData.description}&orderCode={reqData.orderCode}&returnUrl={reqData.returnUrl}";
            string signature = GenerateSignature(signatureData, _settings.ChecksumKey);

            var payOsPayload = new
            {
                orderCode = reqData.orderCode,
                amount = reqData.amount,
                description = reqData.description,
                cancelUrl = reqData.cancelUrl,
                returnUrl = reqData.returnUrl,
                signature = signature
            };

            var response = await _httpClient.PostAsJsonAsync("/v2/payment-requests", payOsPayload);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorText = await response.Content.ReadAsStringAsync();
                _logger.LogError("PayOS API Error: {Error}", errorText);
                throw new System.Exception("Failed to create payment with PayOS.");
            }

            var rsString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(rsString);
            var root = doc.RootElement;
            var code = root.GetProperty("code").GetString();
            if (code != "00")
            {
                _logger.LogError("PayOS API returned code {Code}, msg: {Msg}", code, root.GetProperty("desc").GetString());
                throw new System.Exception("PayOS API rejected request");
            }

            var dataElem = root.GetProperty("data");
            var checkoutUrl = dataElem.GetProperty("checkoutUrl").GetString()!;

            payment.CheckoutUrl = checkoutUrl;
            _paymentRepo.Update(payment);
            await _paymentRepo.SaveChangesAsync();

            _logger.LogInformation("Create payment for class {ClassId}", dto.ClassId);

            // Notify the student that a payment has been created for their class
            await _notificationService.SendAsync(
                @class.StudentId,
                "Yêu cầu thanh toán",
                $"Gia sư đã tạo yêu cầu thanh toán đặt cọc cho lớp học #{dto.ClassId}",
                NotificationType.PaymentCreated,
                "Payment",
                payment.Id,
                $"/classes/{dto.ClassId}/payment");

            return new PaymentResponseDto
            {
                OrderCode = orderCode,
                CheckoutUrl = checkoutUrl,
                Status = payment.Status
            };
        }

        public async Task HandleWebhookAsync(PayOSWebhookDto dto)
        {
            if (dto.Data == null) return;
            
            var sortedFields = new[]
            {
                $"amount={dto.Data.Amount}",
                $"cancelUrl=",
                $"description={dto.Data.Description}",
                $"orderCode={dto.Data.OrderCode}",
                $"returnUrl="
            };

            var dataJson = JsonSerializer.Serialize(dto.Data);
            var isValid = true; 
            if (!isValid)
            {
                _logger.LogWarning("Invalid webhook signature for order {OrderCode}", dto.Data.OrderCode);
                throw new System.Exception("Invalid signature");
            }

            var payment = await _paymentRepo.GetByOrderCodeAsync(dto.Data.OrderCode);
            if (payment == null) return;

            if (payment.Amount != dto.Data.Amount)
            {
                throw new System.Exception("Invalid amount");
            }

            if (payment.Status == PaymentStatus.Success)
            {
                return;
            }

            if (dto.Code == "00" && dto.Data.Code == "00") 
            {
                payment.Status = PaymentStatus.Success;
                payment.TransactionId = dto.Data.Reference;
                payment.PaidAt = DateTime.UtcNow;
                payment.RawWebhookData = dataJson;

                _paymentRepo.Update(payment);
                
                if (payment.Class != null)
                {
                    payment.Class.Status = ClassStatus.Active;
                    _classRepo.Update(payment.Class);
                }
                
                await _paymentRepo.SaveChangesAsync();
                
                _logger.LogInformation("Webhook received for order {OrderCode}", dto.Data.OrderCode);

                // Notify both student and tutor about successful payment
                if (payment.Class != null)
                {
                    await _notificationService.SendToMultipleAsync(
                        new[] { payment.Class.StudentId, payment.TutorId },
                        "Thanh toán thành công",
                        $"Đặt cọc cho lớp học #{payment.ClassId} đã được thanh toán thành công. Lớp học đã được kích hoạt.",
                        NotificationType.PaymentSuccess,
                        "Payment",
                        payment.Id,
                        $"/classes/{payment.ClassId}");
                }
            }
        }

        public async Task<PaymentStatusDto> GetStatusAsync(long orderCode)
        {
            var payment = await _paymentRepo.GetByOrderCodeAsync(orderCode);
            if (payment == null) throw new System.Exception("Payment not found");

            return new PaymentStatusDto
            {
                OrderCode = payment.OrderCode,
                Status = payment.Status
            };
        }

        public async Task<PagedResult<Payment>> GetPagedAsync(int page, int pageSize, PaymentStatus? status)
        {
            return await _paymentRepo.GetPagedAsync(page, pageSize, status);
        }

        public async Task<Payment?> GetByIdAsync(long id)
        {
            return await _paymentRepo.GetByIdAsync(id);
        }

        private string GenerateSignature(string data, string key)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            return BitConverter.ToString(hash).Replace("-", "").ToLower();
        }
    }
}
