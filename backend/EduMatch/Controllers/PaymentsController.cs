using EduMatch.Common.Exception;
using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.DTOs.Payment;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

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
      return this.OkResponse(await _depositPaymentService.CreateDepositAsync(GetCurrentUserId(), dto));
    }

    [HttpGet("learning-requests/{learningRequestId:long}")]
    [Authorize(Roles = "Student,Tutor,Admin")]
    [SwaggerOperation(OperationId = "getPaymentByLearningRequest")]
    [ProducesResponseType(typeof(ApiResponse<DepositPaymentDto?>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<DepositPaymentDto?>>> GetByLearningRequest(long learningRequestId)
    {
      return this.OkResponse(await _depositPaymentService.GetByLearningRequestAsync(
        GetCurrentUserId(),
        User.IsInRole("Admin"),
        learningRequestId));
    }

    [HttpGet("status/{orderCode}")]
    [SwaggerOperation(OperationId = "getPaymentStatus")]
    [ProducesResponseType(typeof(ApiResponse<PaymentStatusDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PaymentStatusDto>>> GetStatus(long orderCode)
    {
      return this.OkResponse(await _depositPaymentService.GetStatusAsync(orderCode));
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

    private long GetCurrentUserId()
    {
      return User.GetRequiredUserId();
    }
  }
}
