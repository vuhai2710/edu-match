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
    [Obsolete("Legacy payment service. Use DepositPaymentService for v2 deposit booking flow.")]
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

        public Task<PaymentResponseDto> CreatePaymentAsync(long tutorId, CreatePaymentRequestDto dto)
        {
            throw new NotSupportedException(
                "Legacy payment creation is disabled. Use DepositPaymentService.CreateDepositAsync (POST /api/payments/deposit).");
        }

        public Task HandleWebhookAsync(PayOSWebhookDto dto)
        {
            throw new NotSupportedException(
                "Legacy webhook handler is disabled. Webhooks are routed to DepositPaymentService.HandleWebhookAsync which performs full HMAC signature verification.");
        }

        public async Task<PaymentStatusDto> GetStatusAsync(long orderCode)
        {
            var payment = await _paymentRepo.GetByOrderCodeAsync(orderCode);
            if (payment == null) throw new System.Exception("Payment not found");

            return new PaymentStatusDto
            {
                OrderCode = payment.OrderCode,
                LearningRequestId = payment.LearningRequestId,
                Amount = payment.Amount,
                Status = payment.Status,
                PaidAt = payment.PaidAt
            };
        }

        public async Task<PagedResult<PaymentAdminDto>> GetPagedAsync(int page, int pageSize, PaymentStatus? status)
        {
            var pagedPayments = await _paymentRepo.GetPagedAsync(page, pageSize, status);

            return new PagedResult<PaymentAdminDto>
            {
                Items = pagedPayments.Items.Select(MapPayment).ToList(),
                TotalCount = pagedPayments.TotalCount,
                Page = pagedPayments.Page,
                PageSize = pagedPayments.PageSize,
                TotalPages = pagedPayments.TotalPages
            };
        }

        public async Task<PaymentAdminDto?> GetByIdAsync(long id)
        {
            var payment = await _paymentRepo.GetByIdAsync(id);
            return payment == null ? null : MapPayment(payment);
        }

        private static PaymentAdminDto MapPayment(Payment payment)
        {
            return new PaymentAdminDto
            {
                Id = payment.Id,
                LearningRequestId = payment.LearningRequestId,
                PaidByUserId = payment.PaidByUserId,
                ClassId = payment.ClassId,
                TutorId = payment.TutorId,
                OrderCode = payment.OrderCode,
                Amount = payment.Amount,
                Description = payment.Description,
                Status = payment.Status,
                CheckoutUrl = payment.CheckoutUrl,
                TransactionId = payment.TransactionId,
                PaidAt = payment.PaidAt,
                CreatedAt = payment.CreatedAt
            };
        }

        private string GenerateSignature(string data, string key)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            return BitConverter.ToString(hash).Replace("-", "").ToLower();
        }
    }
}
