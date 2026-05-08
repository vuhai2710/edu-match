using EduMatch.DTOs;
using EduMatch.DTOs.Applications;
using EduMatch.Exception;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EduMatch.Controllers
{
  [Route("api/applications")]
  [ApiController]
  public class ApplicationsController : ControllerBase
  {
    private readonly IApplicationService _applicationService;

    public ApplicationsController(IApplicationService applicationService)
    {
      _applicationService = applicationService;
    }

    [HttpPost("/api/tutor-requests/{requestId:long}/apply")]
    [Authorize(Roles = "Tutor")]
    public async Task<ActionResult<ApiResponse<ApplicationResponseDto>>> Apply(long requestId, [FromBody] ApplyToRequestDto dto)
    {
      return Ok(await _applicationService.ApplyAsync(GetCurrentUserId(), requestId, dto));
    }

    [HttpGet("/api/tutor-requests/{requestId:long}/applications")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<PagedResult<ApplicationResponseDto>>>> GetByRequest(long requestId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
      return Ok(await _applicationService.GetByRequestIdAsync(requestId, GetCurrentUserId(), page, pageSize));
    }

    [HttpGet("my")]
    [Authorize(Roles = "Tutor")]
    public async Task<ActionResult<ApiResponse<PagedResult<ApplicationResponseDto>>>> GetMyApplications([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
      return Ok(await _applicationService.GetMyApplicationsAsync(GetCurrentUserId(), page, pageSize));
    }

    [HttpPut("{id:long}/student-confirm")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<bool>>> StudentConfirm(long id)
    {
      return Ok(await _applicationService.StudentConfirmAsync(id, GetCurrentUserId()));
    }

    [HttpPut("{id:long}/student-reject")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<bool>>> StudentReject(long id)
    {
      return Ok(await _applicationService.StudentRejectAsync(id, GetCurrentUserId()));
    }

    [HttpPut("{id:long}/student-accept-match")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<bool>>> StudentAcceptMatch(long id)
    {
      return Ok(await _applicationService.StudentAcceptMatchAsync(id, GetCurrentUserId()));
    }

    [HttpPut("{id:long}/tutor-accept-match")]
    [Authorize(Roles = "Tutor")]
    public async Task<ActionResult<ApiResponse<bool>>> TutorAcceptMatch(long id)
    {
      return Ok(await _applicationService.TutorAcceptMatchAsync(id, GetCurrentUserId()));
    }

    private long GetCurrentUserId()
    {
      var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!long.TryParse(userIdClaim, out var userId))
      {
        throw new AppException("Unauthorized", 401);
      }

      return userId;
    }
  }
}
