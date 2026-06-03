using EduMatch.Common.Enums;
using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.DTOs.CancellationRequests;
using EduMatch.DTOs.ClassCompletionRequests;
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
  private readonly IClassCompletionRequestService _classCompletionRequestService;

  public ClassesController(
    IClassReadService classReadService,
    IReviewService reviewService,
    ICancellationRequestService cancellationRequestService,
    IClassCompletionRequestService classCompletionRequestService)
  {
    _classReadService = classReadService;
    _reviewService = reviewService;
    _cancellationRequestService = cancellationRequestService;
    _classCompletionRequestService = classCompletionRequestService;
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
    return this.OkResponse(await _classReadService.GetStudentClassesAsync(GetCurrentUserId(), parameters));
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
    return this.OkResponse(await _classReadService.GetTutorClassesAsync(GetCurrentTutorId(), parameters));
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
    return this.OkResponse(await _classReadService.GetByIdAsync(id, GetCurrentUserId(), User.IsInRole("Admin")));
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
    return this.OkResponse(await _reviewService.GetEligibilityAsync(GetCurrentUserId(), id));
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
    return this.OkResponse(await _cancellationRequestService.GetLatestByClassIdAsync(
      id,
      GetCurrentUserId(),
      GetCurrentUserRole()));
  }

  [HttpGet("{id:long}/completion-request")]
  [Authorize(Roles = "Student,Tutor,Admin")]
  [SwaggerOperation(OperationId = "getClassCompletionRequest")]
  [ProducesResponseType(typeof(ApiResponse<ClassCompletionRequestDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
  public async Task<ActionResult<ApiResponse<ClassCompletionRequestDto>>> GetCompletionRequest(long id)
  {
    return this.OkResponse(await _classCompletionRequestService.GetLatestByClassIdAsync(
      id,
      GetCurrentUserId(),
      GetCurrentUserRole()));
  }

  private long GetCurrentUserId()
  {
    return User.GetRequiredUserId();
  }

  private long GetCurrentTutorId()
  {
    return User.GetRequiredTutorId();
  }

  private UserRole GetCurrentUserRole()
  {
    return User.GetRequiredUserRole();
  }
}
