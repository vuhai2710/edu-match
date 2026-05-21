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

#pragma warning disable CS0618
    private readonly IPaymentService _legacyPaymentService;
#pragma warning restore CS0618

    public PaymentsController(
      IDepositPaymentService depositPaymentService,
#pragma warning disable CS0618
      IPaymentService legacyPaymentService
#pragma warning restore CS0618
    )
    {
      _depositPaymentService = depositPaymentService;
      _legacyPaymentService = legacyPaymentService;
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

    // Legacy Endpoints (Deprecated)

    [Obsolete("Use POST /api/payments/deposit instead")]
    [HttpPost("create")]
    [Authorize(Roles = "Tutor")]
    [SwaggerOperation(OperationId = "createPayment")]
    [ProducesResponseType(typeof(ApiResponse<PaymentResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<PaymentResponseDto>>> CreatePayment(
      [FromBody] CreatePaymentRequestDto dto)
    {
      var tutorIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(tutorIdStr) || !long.TryParse(tutorIdStr, out long tutorId))
      {
        return Unauthorized(ErrorResponse.Create("Invalid token", "UNAUTHORIZED"));
      }

      try
      {
#pragma warning disable CS0618
        var result = await _legacyPaymentService.CreatePaymentAsync(tutorId, dto);
#pragma warning restore CS0618
        return Ok(ApiResponse<PaymentResponseDto>.SuccessResult(result));
      }
      catch (System.Exception ex)
      {
        return BadRequest(ErrorResponse.Create(ex.Message, "PAYMENT_CREATE_FAILED"));
      }
    }
  }
}
