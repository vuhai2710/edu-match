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
    public async Task<ActionResult<ApiResponse<AdminDashboardDto>>> GetAdminDashboard()
    {
      return this.OkResponse(await _svc.GetAdminDashboardAsync());
    }

    [HttpGet("tutor")]
    [Authorize(Roles = "Tutor")]
    [SwaggerOperation(OperationId = "getTutorDashboard")]
    [ProducesResponseType(typeof(ApiResponse<TutorDashboardDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<TutorDashboardDto>>> GetTutorDashboard()
    {
      return this.OkResponse(await _svc.GetTutorDashboardAsync(User.GetRequiredTutorId()));
    }

    [HttpGet("student")]
    [Authorize(Roles = "Student")]
    [SwaggerOperation(OperationId = "getStudentDashboard")]
    [ProducesResponseType(typeof(ApiResponse<StudentDashboardDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<StudentDashboardDto>>> GetStudentDashboard()
    {
      return this.OkResponse(await _svc.GetStudentDashboardAsync(User.GetRequiredUserId()));
    }
  }
}
