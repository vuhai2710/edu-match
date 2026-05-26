using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.DTOs.Dashboard;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace EduMatch.Controllers
{
  [ApiController]
  [Route("api/dashboard")]
  [Authorize]
  public class DashboardController : ControllerBase
  {
    private readonly IDashboardService _svc;

    public DashboardController(IDashboardService svc)
    {
      _svc = svc;
    }

    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    [SwaggerOperation(OperationId = "getAdminDashboard")]
    [ProducesResponseType(typeof(ApiResponse<AdminDashboardDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAdminDashboard()
    {
      var data = await _svc.GetAdminDashboardAsync();
      return Ok(ApiResponse<AdminDashboardDto>.SuccessResult(data));
    }

    [HttpGet("tutor")]
    [Authorize(Roles = "Tutor")]
    [SwaggerOperation(OperationId = "getTutorDashboard")]
    [ProducesResponseType(typeof(ApiResponse<TutorDashboardDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTutorDashboard()
    {
      var tutorProfileId = User.GetRequiredTutorId();
      var data = await _svc.GetTutorDashboardAsync(tutorProfileId);
      return Ok(ApiResponse<TutorDashboardDto>.SuccessResult(data));
    }

    [HttpGet("student")]
    [Authorize(Roles = "Student")]
    [SwaggerOperation(OperationId = "getStudentDashboard")]
    [ProducesResponseType(typeof(ApiResponse<StudentDashboardDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStudentDashboard()
    {
      var userId = User.GetRequiredUserId();
      var data = await _svc.GetStudentDashboardAsync(userId);
      return Ok(ApiResponse<StudentDashboardDto>.SuccessResult(data));
    }
  }
}
