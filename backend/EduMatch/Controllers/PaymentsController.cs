using EduMatch.DTOs;
using EduMatch.DTOs.Payment;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Security.Claims;

namespace EduMatch.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  public class PaymentsController : ControllerBase
  {
    private readonly IDepositPaymentService _depositPaymentService;

    public PaymentsController(IDepositPaymentService depositPaymentService)
    {
      _depositPaymentService = depositPaymentService;
    }

    [HttpPost("deposit")]
    [Authorize(Roles = "Student,Tutor")]
    [SwaggerOperation(OperationId = "createDepositPayment")]
    [ProducesResponseType(typeof(ApiResponse<PaymentResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<PaymentResponseDto>>> CreateDepositPayment(
      [FromBody] CreateDepositPaymentRequest dto)
    {
      var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userIdStr) || !long.TryParse(userIdStr, out long userId))
      {
        return Unauthorized(ErrorResponse.Create("Invalid token", "UNAUTHORIZED"));
      }

      var result = await _depositPaymentService.CreateDepositAsync(userId, dto);
      return Ok(ApiResponse<PaymentResponseDto>.SuccessResult(result));
    }

    [HttpGet("status/{orderCode}")]
    [SwaggerOperation(OperationId = "getPaymentStatus")]
    [ProducesResponseType(typeof(ApiResponse<PaymentStatusDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PaymentStatusDto>>> GetStatus(long orderCode)
    {
      var result = await _depositPaymentService.GetStatusAsync(orderCode);
      return Ok(ApiResponse<PaymentStatusDto>.SuccessResult(result));
    }

    [HttpPost("webhook")]
    [SwaggerOperation(OperationId = "handlePaymentWebhook")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse>> Webhook([FromBody] PayOSWebhookDto dto)
    {
      await _depositPaymentService.HandleWebhookAsync(dto);
      return Ok(ApiResponse.Ok("Webhook processed"));
    }

    // Legacy Endpoints (Disabled — 410 Gone after v2 cutover)

    [Obsolete("Use POST /api/payments/deposit instead")]
    [HttpPost("create")]
    [SwaggerOperation(OperationId = "createPayment")]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status410Gone)]
    public ActionResult<ApiResponse<PaymentResponseDto>> CreatePayment(
      [FromBody] CreatePaymentRequestDto dto)
    {
      return StatusCode(StatusCodes.Status410Gone,
        ErrorResponse.Create(
          "Endpoint đã ngừng sử dụng. Vui lòng dùng POST /api/payments/deposit.",
          "LEGACY_FLOW_DISABLED"));
    }
  }
}
