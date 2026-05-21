using System.Security.Claims;
using EduMatch.Common.Exception;
using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.DTOs.ScheduleProposals;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace EduMatch.Controllers
{
  [Route("api/schedule-proposals")]
  [ApiController]
  public class ScheduleProposalsController : ControllerBase
  {
    private readonly IScheduleProposalService _scheduleProposalService;

    public ScheduleProposalsController(IScheduleProposalService scheduleProposalService)
    {
      _scheduleProposalService = scheduleProposalService;
    }

    [HttpPost]
    [Authorize(Roles = "Tutor")]
    [SwaggerOperation(OperationId = "createScheduleProposal")]
    [ProducesResponseType(typeof(ApiResponse<ScheduleProposalDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<ScheduleProposalDto>>> Create([FromBody] CreateScheduleProposalDto dto)
    {
      var result = await _scheduleProposalService.CreateAsync(GetCurrentTutorProfileId(), dto);
      return this.CreatedResponse(
        $"/api/schedule-proposals/{result.Id}",
        ApiResponse<ScheduleProposalDto>.SuccessResult(result, "Tạo đề xuất lịch học thành công."));
    }

    [HttpPut("{id:long}/accept")]
    [Authorize(Roles = "Student")]
    [SwaggerOperation(OperationId = "acceptScheduleProposal")]
    [ProducesResponseType(typeof(ApiResponse<ScheduleProposalDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<ScheduleProposalDto>>> Accept(long id)
    {
      var result = await _scheduleProposalService.AcceptAsync(id, GetCurrentUserId());
      return this.OkResponse(ApiResponse<ScheduleProposalDto>.SuccessResult(result, "Chấp nhận đề xuất lịch học thành công."));
    }

    [HttpPut("{id:long}/reject")]
    [Authorize(Roles = "Student")]
    [SwaggerOperation(OperationId = "rejectScheduleProposal")]
    [ProducesResponseType(typeof(ApiResponse<ScheduleProposalDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<ScheduleProposalDto>>> Reject(long id)
    {
      var result = await _scheduleProposalService.RejectAsync(id, GetCurrentUserId());
      return this.OkResponse(ApiResponse<ScheduleProposalDto>.SuccessResult(result, "Từ chối đề xuất lịch học thành công."));
    }

    private long GetCurrentUserId()
    {
      var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!long.TryParse(userIdClaim, out var userId))
      {
        throw new UnauthorizedException("Không thể xác thực người dùng.");
      }

      return userId;
    }

    private long GetCurrentTutorProfileId()
    {
      var tutorIdClaim = User.FindFirstValue("tutorId");
      if (!long.TryParse(tutorIdClaim, out var tutorProfileId))
      {
        throw new UnauthorizedException("Không thể xác thực gia sư.");
      }

      return tutorProfileId;
    }
  }
}
