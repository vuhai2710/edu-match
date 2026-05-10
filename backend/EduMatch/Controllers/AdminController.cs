using EduMatch.Common.Enums;
using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.DTOs.Applications;
using EduMatch.DTOs.TutorRequests;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace EduMatch.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  [Authorize(Roles = "Admin")]
  public class AdminController : ControllerBase
  {
    private readonly IApplicationService _applicationService;
    private readonly ITutorRequestService _tutorRequestService;
    private readonly IPaymentService _paymentService;

    public AdminController(IApplicationService applicationService, ITutorRequestService tutorRequestService, IPaymentService paymentService)
    {
      _applicationService = applicationService;
      _tutorRequestService = tutorRequestService;
      _paymentService = paymentService;
    }

    [HttpGet("applications")]
    [SwaggerOperation(OperationId = "getAllApplicationsForAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ApplicationResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<PagedResult<ApplicationResponseDto>>>> GetAllApplications([FromQuery] ApplicationQueryParameters parameters)
    {
      var response = await _applicationService.GetAllForAdminAsync(parameters);
      return this.OkResponse(response);
    }

    [HttpGet("tutor-requests")]
    [SwaggerOperation(OperationId = "getAllRequestsForAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<TutorRequestResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<PagedResult<TutorRequestResponseDto>>>> GetAllRequests([FromQuery] TutorRequestFilterDto filter)
    {
      var response = await _tutorRequestService.GetAllAsync(filter);
      return this.OkResponse(response);
    }

    [HttpPut("applications/{id:long}/approve")]
    [SwaggerOperation(OperationId = "adminApproveApplication")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<bool>>> AdminApprove(long id, [FromBody] AdminApproveRequestDto dto)
    {
      var response = await _applicationService.AdminApproveAsync(id, dto.DepositAmount);
      return this.OkResponse(response);
    }

    [HttpPut("applications/{id:long}/reject")]
    [SwaggerOperation(OperationId = "adminRejectApplication")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<bool>>> AdminReject(long id)
    {
      var response = await _applicationService.AdminRejectAsync(id);
      return this.OkResponse(response);
    }

    [HttpPost("requests/{requestId:long}/match")]
    [SwaggerOperation(OperationId = "adminMatchRequest")]
    [ProducesResponseType(typeof(ApiResponse<ApplicationResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<ApplicationResponseDto>>> AdminMatch(long requestId, [FromBody] AdminMatchRequestDto dto)
    {
      var response = await _applicationService.AdminMatchAsync(requestId, dto.TutorProfileId, dto.DepositAmount);
      return this.OkResponse(response);
    }

    [HttpPost("tutor-requests/{studentId:long}")]
    [SwaggerOperation(OperationId = "adminCreateRequestForStudent")]
    [ProducesResponseType(typeof(ApiResponse<TutorRequestResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<TutorRequestResponseDto>>> AdminCreateTutorRequest(long studentId, [FromBody] CreateTutorRequestDto dto)
    {
      var response = await _tutorRequestService.CreateAsync(studentId, dto);
      return this.CreatedResponse($"/api/tutorrequests/{response.Data?.Id}", response);
    }

    [HttpGet("payments")]
    [SwaggerOperation(OperationId = "getAllPayments")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<EduMatch.Models.Payment>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<PagedResult<EduMatch.Models.Payment>>>> GetAllPayments([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] PaymentStatus? status = null)
    {
      return this.OkResponse(ApiResponse<PagedResult<EduMatch.Models.Payment>>.SuccessResult(await _paymentService.GetPagedAsync(page, pageSize, status)));
    }

    [HttpGet("payments/{id:long}")]
    [SwaggerOperation(OperationId = "getPaymentById")]
    [ProducesResponseType(typeof(ApiResponse<EduMatch.Models.Payment>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<EduMatch.Models.Payment>>> GetPaymentById(long id)
    {
      var payment = await _paymentService.GetByIdAsync(id);
      if (payment == null)
      {
        return NotFound(ApiResponse.Fail("Payment not found", StatusCodes.Status404NotFound));
      }

      return this.OkResponse(ApiResponse<EduMatch.Models.Payment>.SuccessResult(payment));
    }
  }
}
