using System.Security.Claims;
using EduMatch.DTOs;
using EduMatch.DTOs.Payment;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduMatch.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentsController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpPost("create")]
        [Authorize(Roles = "Tutor")]
        public async Task<ActionResult<ApiResponse<PaymentResponseDto>>> CreatePayment([FromBody] CreatePaymentRequestDto dto)
        {
            var tutorIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(tutorIdStr) || !long.TryParse(tutorIdStr, out long tutorId))
            {
                return Unauthorized(ApiResponse.Fail("Invalid token"));
            }

            try
            {
                var result = await _paymentService.CreatePaymentAsync(tutorId, dto);
                return Ok(ApiResponse<PaymentResponseDto>.SuccessResult(result));
            }
            catch (System.Exception ex)
            {
                return BadRequest(ApiResponse.Fail(ex.Message));
            }
        }

        [HttpGet("status/{orderCode}")]
        public async Task<ActionResult<ApiResponse<PaymentStatusDto>>> GetStatus(long orderCode)
        {
            try
            {
                var result = await _paymentService.GetStatusAsync(orderCode);
                return Ok(ApiResponse<PaymentStatusDto>.SuccessResult(result));
            }
            catch (System.Exception ex)
            {
                return BadRequest(ApiResponse.Fail(ex.Message));
            }
        }

        [HttpPost("webhook")]
        public async Task<IActionResult> Webhook([FromBody] PayOSWebhookDto dto)
        {
            try
            {
                await _paymentService.HandleWebhookAsync(dto);
                var rs = new { success = true, data = new object(), message = "" };
                return Ok(rs);
            }
            catch
            {
                var rs = new { success = false, message = "Webhook handling failed" };
                return BadRequest(rs);
            }
        }
    }
}
