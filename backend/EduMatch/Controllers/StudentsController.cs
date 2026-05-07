using EduMatch.DTOs;
using EduMatch.DTOs.StudentProfile;
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

    public StudentsController(IStudentService studentService)
    {
      _studentService = studentService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResponse<StudentDto>>>> GetStudents([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
      var result = await _studentService.GetStudentsAsync(pageNumber, pageSize);
      return Ok(ApiResponse<PagedResponse<StudentDto>>.SuccessResult(result));
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
  }
}
