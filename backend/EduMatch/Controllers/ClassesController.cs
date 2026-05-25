using System.Security.Claims;
using EduMatch.Common.Exception;
using EduMatch.Common.Extensions;
using EduMatch.Common.Enums;
using EduMatch.DTOs;
using EduMatch.DTOs.CancellationRequests;
using EduMatch.DTOs.Classes;
using EduMatch.DTOs.Review;
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
  private readonly IReviewService _reviewService;
  private readonly ICancellationRequestService _cancellationRequestService;

  public ClassesController(
    IClassReadService classReadService,
    IReviewService reviewService,
    ICancellationRequestService cancellationRequestService)
  {
    _classReadService = classReadService;
    _reviewService = reviewService;
    _cancellationRequestService = cancellationRequestService;
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

  [HttpGet("{id:long}/review-eligibility")]
  [Authorize(Roles = "Student")]
  [SwaggerOperation(OperationId = "getClassReviewEligibility")]
  [ProducesResponseType(typeof(ApiResponse<ReviewEligibilityDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
  public async Task<ActionResult<ApiResponse<ReviewEligibilityDto>>> GetReviewEligibility(long id)
  {
    var result = await _reviewService.GetEligibilityAsync(GetCurrentUserId(), id);
    return this.OkResponse(ApiResponse<ReviewEligibilityDto>.SuccessResult(result));
  }

  [HttpGet("{id:long}/cancellation-request")]
  [Authorize(Roles = "Student,Tutor,Admin")]
  [SwaggerOperation(OperationId = "getClassCancellationRequest")]
  [ProducesResponseType(typeof(ApiResponse<CancellationRequestDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
  public async Task<ActionResult<ApiResponse<CancellationRequestDto>>> GetCancellationRequest(long id)
  {
    var result = await _cancellationRequestService.GetLatestByClassIdAsync(
      id,
      GetCurrentUserId(),
      GetCurrentUserRole());

    return this.OkResponse(result);
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

  private UserRole GetCurrentUserRole()
  {
    var roleClaim = User.FindFirstValue(ClaimTypes.Role);
    if (!Enum.TryParse<UserRole>(roleClaim, true, out var role))
    {
      throw new UnauthorizedException("Cannot determine user role.");
    }

    return role;
  }
}
