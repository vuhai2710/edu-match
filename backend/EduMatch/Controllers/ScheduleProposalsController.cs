using EduMatch.Common.Enums;
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
      var result = await _scheduleProposalService.CreateAsync(GetCurrentTutorId(), dto);
      return this.CreatedResponse(
        $"/api/schedule-proposals/{result.Id}",
        ApiResponse<ScheduleProposalDto>.SuccessResult(result, "Tao de xuat lich hoc thanh cong."));
    }

    [HttpGet("{id:long}")]
    [Authorize(Roles = "Student,Tutor,Admin")]
    [SwaggerOperation(OperationId = "getScheduleProposalById")]
    [ProducesResponseType(typeof(ApiResponse<ScheduleProposalDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<ScheduleProposalDto>>> GetById(long id)
    {
      var result = await _scheduleProposalService.GetByIdAsync(
        id,
        GetCurrentUserId(),
        GetCurrentUserRole(),
        TryGetCurrentTutorId());

      return this.OkResponse(ApiResponse<ScheduleProposalDto>.SuccessResult(result));
    }

    [HttpPut("{id:long}/accept")]
    [Authorize(Roles = "Student")]
    [SwaggerOperation(OperationId = "acceptScheduleProposal")]
    [ProducesResponseType(typeof(ApiResponse<ScheduleProposalDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<ScheduleProposalDto>>> Accept(long id)
    {
      var result = await _scheduleProposalService.AcceptAsync(id, GetCurrentUserId());
      return this.OkResponse(result);
    }

    [HttpPut("{id:long}/reject")]
    [Authorize(Roles = "Student")]
    [SwaggerOperation(OperationId = "rejectScheduleProposal")]
    [ProducesResponseType(typeof(ApiResponse<ScheduleProposalDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<ScheduleProposalDto>>> Reject(long id)
    {
      var result = await _scheduleProposalService.RejectAsync(id, GetCurrentUserId());
      return this.OkResponse(result);
    }

    private long GetCurrentUserId()
    {
      return User.GetRequiredUserId();
    }

    private long GetCurrentTutorId()
    {
      return User.GetRequiredTutorId();
    }

    private long? TryGetCurrentTutorId()
    {
      return User.TryGetLongClaim("tutorId");
    }

    private UserRole GetCurrentUserRole()
    {
      return User.GetRequiredUserRole();
    }
  }
}
