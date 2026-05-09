using EduMatch.DTOs;
using EduMatch.DTOs.Dashboard;
using EduMatch.Exception;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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
    public async Task<IActionResult> GetAdminDashboard()
    {
      var data = await _svc.GetAdminDashboardAsync();
      return Ok(ApiResponse<AdminDashboardDto>.SuccessResult(data));
    }

    [HttpGet("tutor")]
    [Authorize(Roles = "Tutor")]
    public async Task<IActionResult> GetTutorDashboard()
    {
      var tutorIdClaim = User.FindFirstValue("tutorId");
      if (!long.TryParse(tutorIdClaim, out var tutorProfileId))
        throw new AppException("Missing or invalid tutorId claim", 401);

      var data = await _svc.GetTutorDashboardAsync(tutorProfileId);
      return Ok(ApiResponse<TutorDashboardDto>.SuccessResult(data));
    }

    [HttpGet("student")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetStudentDashboard()
    {
      var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!long.TryParse(userIdClaim, out var userId))
        throw new AppException("Missing or invalid userId claim", 401);

      var data = await _svc.GetStudentDashboardAsync(userId);
      return Ok(ApiResponse<StudentDashboardDto>.SuccessResult(data));
    }
  }
}
