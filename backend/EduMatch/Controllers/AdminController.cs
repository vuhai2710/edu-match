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

    public AdminController(IApplicationService applicationService, ITutorRequestService tutorRequestService)
    {
      _applicationService = applicationService;
      _tutorRequestService = tutorRequestService;
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
    public async Task<ActionResult<ApiResponse<bool>>> AdminApprove(long id)
    {
      return Ok(await _applicationService.AdminApproveAsync(id));
    }

    [HttpPut("applications/{id:long}/reject")]
    public async Task<ActionResult<ApiResponse<bool>>> AdminReject(long id)
    {
      return Ok(await _applicationService.AdminRejectAsync(id));
    }

    [HttpPost("requests/{requestId:long}/match")]
    public async Task<ActionResult<ApiResponse<ApplicationResponseDto>>> AdminMatch(long requestId, [FromBody] AdminMatchRequestDto dto)
    {
      return Ok(await _applicationService.AdminMatchAsync(requestId, dto.TutorProfileId));
    }
  }
}
