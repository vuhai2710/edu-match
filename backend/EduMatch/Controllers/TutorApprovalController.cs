using EduMatch.DTOs;
using EduMatch.DTOs.Dashboard;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
    public async Task<IActionResult> GetPendingTutors(
      [FromQuery] int page = 1,
      [FromQuery] int pageSize = 10)
    {
      var result = await _svc.GetPendingTutorsAsync(page, pageSize);
      return Ok(ApiResponse<PagedResult<PendingTutorItemDto>>.SuccessResult(result));
    }

    [HttpPut("{tutorProfileId:long}/approve")]
    public async Task<IActionResult> Approve(long tutorProfileId)
    {
      await _svc.ApproveAsync(tutorProfileId);
      return Ok(ApiResponse.Ok("Đã duyệt thành công"));
    }

    [HttpPut("{tutorProfileId:long}/reject")]
    public async Task<IActionResult> Reject(long tutorProfileId)
    {
      await _svc.RejectAsync(tutorProfileId);
      return Ok(ApiResponse.Ok("Đã từ chối"));
    }
  }
}
