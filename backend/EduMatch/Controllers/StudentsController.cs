using EduMatch.DTOs;
using EduMatch.DTOs.Auth;
using EduMatch.DTOs.Student;
using EduMatch.DTOs.StudentProfile;
using EduMatch.Services;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EduMatch.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  public class StudentsController : ControllerBase
  {
    private readonly IStudentService _studentService;
    private readonly AuthService _authService;

    public StudentsController(IStudentService studentService, AuthService authService)
    {
      _studentService = studentService;
      _authService = authService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<StudentDto>>>> GetStudents([FromQuery] StudentQueryParameters parameters)
    {
      var result = await _studentService.GetStudentsAsync(parameters);
      return Ok(ApiResponse<PagedResult<StudentDto>>.SuccessResult(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<StudentDetailDto>>> GetStudentById(long id)
    {
      var result = await _studentService.GetStudentByIdAsync(id);
      return Ok(ApiResponse<StudentDetailDto>.SuccessResult(result));
    }

    [HttpGet("me")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<StudentDetailDto>>> GetMyProfile()
    {
      var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!long.TryParse(userIdClaim, out var userId))
      {
        return Unauthorized(ApiResponse.Fail("Không thể xác thực người dùng"));
      }

      var result = await _studentService.GetMyProfileAsync(userId);
      return Ok(ApiResponse<StudentDetailDto>.SuccessResult(result));
    }

    [HttpPut("me")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<StudentDetailDto>>> UpdateMyProfile([FromBody] UpdateStudentDto dto)
    {
      var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!long.TryParse(userIdClaim, out var userId))
      {
        return Unauthorized(ApiResponse.Fail("Không thể xác thực người dùng"));
      }

      var result = await _studentService.UpdateMyProfileAsync(userId, dto);
      return Ok(ApiResponse<StudentDetailDto>.SuccessResult(result, "Cập nhật hồ sơ thành công"));
    }

    [HttpPost("become-tutor")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse>> BecomeTutor([FromBody] BecomeTutorDto dto)
    {
      var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
      if (userIdClaim == null || !long.TryParse(userIdClaim, out var userId))
      {
        return Unauthorized(ApiResponse.Fail("Unauthorized"));
      }

      await _authService.BecomeTutorAsync(userId, dto);
      return Ok(ApiResponse.Ok("Yêu cầu trở thành Gia sư đã được gửi. Vui lòng chờ Admin xét duyệt."));
    }
  }
}
