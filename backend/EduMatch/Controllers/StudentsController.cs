using EduMatch.Common.Exception;
using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.DTOs.StudentProfile;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

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
    [SwaggerOperation(OperationId = "getStudents")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<StudentDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<PagedResult<StudentDto>>>> GetStudents([FromQuery] StudentQueryParameters parameters)
    {
      var result = await _studentService.GetStudentsAsync(parameters);
      return this.OkResponse(ApiResponse<PagedResult<StudentDto>>.SuccessResult(result));
    }

    [HttpGet("{id}")]
    [SwaggerOperation(
      OperationId = "getStudentById",
      Summary = "Get student profile by student ID",
      Description = "The route parameter {id} is the Student profile ID.")]
    [ProducesResponseType(typeof(ApiResponse<StudentDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<StudentDetailDto>>> GetStudentById([FromRoute(Name = "id")] long studentId)
    {
      var result = await _studentService.GetStudentByIdAsync(studentId);
      return this.OkResponse(ApiResponse<StudentDetailDto>.SuccessResult(result));
    }

    [HttpGet("me")]
    [Authorize(Roles = "Student")]
    [SwaggerOperation(OperationId = "getMyStudentProfile")]
    [ProducesResponseType(typeof(ApiResponse<StudentDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<StudentDetailDto>>> GetMyProfile()
    {
      var result = await _studentService.GetMyProfileAsync(GetCurrentUserId());
      return this.OkResponse(ApiResponse<StudentDetailDto>.SuccessResult(result));
    }

    [HttpPut("me")]
    [Authorize(Roles = "Student")]
    [SwaggerOperation(OperationId = "updateMyStudentProfile")]
    [ProducesResponseType(typeof(ApiResponse<StudentDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<StudentDetailDto>>> UpdateMyProfile([FromBody] UpdateStudentDto dto)
    {
      var result = await _studentService.UpdateMyProfileAsync(GetCurrentUserId(), dto);
      return this.OkResponse(ApiResponse<StudentDetailDto>.SuccessResult(result, "Cập nhật hồ sơ thành công"));
    }

    private long GetCurrentUserId()
    {
      return User.GetRequiredUserId();
    }
  }
}
