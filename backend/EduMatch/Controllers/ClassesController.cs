using System.Security.Claims;
using EduMatch.Common.Exception;
using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.DTOs.Classes;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace EduMatch.Controllers;

[Route("api/classes")]
[ApiController]
public class ClassesController : ControllerBase
{
  private readonly IClassReadService _classReadService;

  public ClassesController(IClassReadService classReadService)
  {
    _classReadService = classReadService;
  }

  [HttpGet("me")]
  [Authorize(Roles = "Student")]
  [SwaggerOperation(OperationId = "getMyClasses")]
  [ProducesResponseType(typeof(ApiResponse<PagedResult<ClassDto>>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
  public async Task<ActionResult<ApiResponse<PagedResult<ClassDto>>>> GetMyClasses([FromQuery] ClassQueryParameters parameters)
  {
    var result = await _classReadService.GetStudentClassesAsync(GetCurrentUserId(), parameters);
    return this.OkResponse(ApiResponse<PagedResult<ClassDto>>.SuccessResult(result));
  }

  [HttpGet("tutor")]
  [Authorize(Roles = "Tutor")]
  [SwaggerOperation(OperationId = "getTutorClasses")]
  [ProducesResponseType(typeof(ApiResponse<PagedResult<ClassDto>>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
  public async Task<ActionResult<ApiResponse<PagedResult<ClassDto>>>> GetTutorClasses([FromQuery] ClassQueryParameters parameters)
  {
    var result = await _classReadService.GetTutorClassesAsync(GetCurrentTutorId(), parameters);
    return this.OkResponse(ApiResponse<PagedResult<ClassDto>>.SuccessResult(result));
  }

  [HttpGet("{id:long}")]
  [Authorize(Roles = "Student,Tutor,Admin")]
  [SwaggerOperation(OperationId = "getClassById")]
  [ProducesResponseType(typeof(ApiResponse<ClassDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
  public async Task<ActionResult<ApiResponse<ClassDto>>> GetById(long id)
  {
    var result = await _classReadService.GetByIdAsync(id, GetCurrentUserId(), User.IsInRole("Admin"));
    return this.OkResponse(ApiResponse<ClassDto>.SuccessResult(result));
  }

  private long GetCurrentUserId()
  {
    var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!long.TryParse(userIdClaim, out var userId))
    {
      throw new UnauthorizedException("Khong the xac thuc nguoi dung.");
    }

    return userId;
  }

  private long GetCurrentTutorId()
  {
    var tutorIdClaim = User.FindFirstValue("tutorId");
    if (!long.TryParse(tutorIdClaim, out var tutorId))
    {
      throw new UnauthorizedException("Khong the xac thuc gia su.");
    }

    return tutorId;
  }
}
