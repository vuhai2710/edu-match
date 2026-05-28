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
      return this.OkResponse(await _studentService.GetStudentsAsync(parameters));
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
      return this.OkResponse(await _studentService.GetStudentByIdAsync(studentId));
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
      return this.OkResponse(await _studentService.GetMyProfileAsync(GetCurrentUserId()));
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
      return this.OkResponse(await _studentService.UpdateMyProfileAsync(GetCurrentUserId(), dto));
    }

    private long GetCurrentUserId()
    {
      return User.GetRequiredUserId();
    }
  }
}
