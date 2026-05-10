using EduMatch.DTOs;
using EduMatch.DTOs.Dashboard;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace EduMatch.Controllers
{
  [ApiController]
  [Route("api/admin/tutors")]
  [Authorize(Roles = "Admin")]
  public class TutorApprovalController : ControllerBase
  {
    private readonly ITutorApprovalService _svc;

    public TutorApprovalController(ITutorApprovalService svc)
    {
      _svc = svc;
    }

    [HttpGet("pending")]
    [SwaggerOperation(OperationId = "getPendingTutors")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PendingTutorItemDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<PagedResult<PendingTutorItemDto>>>> GetPendingTutors(
      [FromQuery] int page = 1,
      [FromQuery] int pageSize = 10)
    {
      var result = await _svc.GetPendingTutorsAsync(page, pageSize);
      return Ok(ApiResponse<PagedResult<PendingTutorItemDto>>.SuccessResult(result));
    }

    [HttpPut("{tutorProfileId:long}/approve")]
    [SwaggerOperation(OperationId = "approveTutor")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse>> Approve(long tutorProfileId)
    {
      await _svc.ApproveAsync(tutorProfileId);
      return Ok(ApiResponse.Ok("Đã duyệt thành công"));
    }

    [HttpPut("{tutorProfileId:long}/reject")]
    [SwaggerOperation(OperationId = "rejectTutor")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse>> Reject(long tutorProfileId)
    {
      await _svc.RejectAsync(tutorProfileId);
      return Ok(ApiResponse.Ok("Đã từ chối"));
    }
  }
}
