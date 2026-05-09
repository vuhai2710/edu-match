using EduMatch.DTOs;
using EduMatch.DTOs.Applications;
using EduMatch.DTOs.TutorRequests;
using EduMatch.Enums;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
    public async Task<ActionResult<ApiResponse<PagedResult<ApplicationResponseDto>>>> GetAllApplications([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] ApplicationStatus? status = null)
    {
      return Ok(await _applicationService.GetAllForAdminAsync(page, pageSize, status));
    }

    [HttpGet("tutor-requests")]
    public async Task<ActionResult<ApiResponse<PagedResult<TutorRequestResponseDto>>>> GetAllRequests([FromQuery] TutorRequestFilterDto filter)
    {
      return Ok(await _tutorRequestService.GetAllAsync(filter));
    }

    [HttpPut("applications/{id:long}/approve")]
    public async Task<ActionResult<ApiResponse<bool>>> AdminApprove(long id, [FromBody] AdminApproveRequestDto dto)
    {
      return Ok(await _applicationService.AdminApproveAsync(id, dto.DepositAmount));
    }

    [HttpPut("applications/{id:long}/reject")]
    public async Task<ActionResult<ApiResponse<bool>>> AdminReject(long id)
    {
      return Ok(await _applicationService.AdminRejectAsync(id));
    }

    [HttpPost("requests/{requestId:long}/match")]
    public async Task<ActionResult<ApiResponse<ApplicationResponseDto>>> AdminMatch(long requestId, [FromBody] AdminMatchRequestDto dto)
    {
      return Ok(await _applicationService.AdminMatchAsync(requestId, dto.TutorProfileId, dto.DepositAmount));
    }

    [HttpPost("tutor-requests/{studentId:long}")]
    public async Task<ActionResult<ApiResponse<TutorRequestResponseDto>>> AdminCreateTutorRequest(long studentId, [FromBody] CreateTutorRequestDto dto)
    {
      return Ok(await _tutorRequestService.CreateAsync(studentId, dto));
    }

    [HttpGet("payments")]
    public async Task<ActionResult<ApiResponse<PagedResult<EduMatch.Models.Payment>>>> GetAllPayments([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] PaymentStatus? status = null)
    {
      return Ok(ApiResponse<PagedResult<EduMatch.Models.Payment>>.SuccessResult(await _paymentService.GetPagedAsync(page, pageSize, status)));
    }

    [HttpGet("payments/{id:long}")]
    public async Task<ActionResult<ApiResponse<EduMatch.Models.Payment>>> GetPaymentById(long id)
    {
      var payment = await _paymentService.GetByIdAsync(id);
      if (payment == null)
      {
          return NotFound(ApiResponse.Fail("Payment not found"));
      }
      return Ok(ApiResponse<EduMatch.Models.Payment>.SuccessResult(payment));
    }
  }
}
