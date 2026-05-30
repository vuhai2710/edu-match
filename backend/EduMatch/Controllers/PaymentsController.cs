using EduMatch.Common.Enums;
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

    [HttpGet("my")]
    [Authorize(Roles = "Student,Tutor")]
    [SwaggerOperation(OperationId = "getMyPayments")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PaymentAdminDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<PagedResult<PaymentAdminDto>>>> GetMyPayments(
      [FromQuery] int page = 1,
      [FromQuery] int pageSize = 10,
      [FromQuery] PaymentStatus? status = null)
    {
      return this.OkResponse(await _depositPaymentService.GetMyPaymentsAsync(GetCurrentUserId(), page, pageSize, status));
    }

    [HttpGet("my/{id:long}")]
    [Authorize(Roles = "Student,Tutor")]
    [SwaggerOperation(OperationId = "getMyPaymentById")]
    [ProducesResponseType(typeof(ApiResponse<PaymentAdminDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PaymentAdminDto>>> GetMyPaymentById(long id)
    {
      return this.OkResponse(await _depositPaymentService.GetMyPaymentByIdAsync(GetCurrentUserId(), id));
    }

    private long GetCurrentUserId()
    {
      return User.GetRequiredUserId();
    }
  }
}
