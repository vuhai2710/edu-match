using System.Security.Claims;
using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.DTOs.LearningRequests;
using EduMatch.DTOs.ScheduleProposals;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace EduMatch.Controllers
{
  [Route("api/learning-requests")]
  [ApiController]
  public class LearningRequestsController : ControllerBase
  {
    private readonly ILearningRequestService _learningRequestService;
    private readonly ITutorLearningRequestService _tutorLearningRequestService;
    private readonly IScheduleProposalService _scheduleProposalService;

    public LearningRequestsController(
      ILearningRequestService learningRequestService,
      ITutorLearningRequestService tutorLearningRequestService,
      IScheduleProposalService scheduleProposalService)
    {
      _learningRequestService = learningRequestService;
      _tutorLearningRequestService = tutorLearningRequestService;
      _scheduleProposalService = scheduleProposalService;
    }

    [HttpPost]
    [Authorize(Roles = "Student")]
    [SwaggerOperation(OperationId = "createLearningRequest")]
    [ProducesResponseType(typeof(ApiResponse<LearningRequestDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<LearningRequestDto>>> Create([FromBody] CreateLearningRequestDto dto)
    {
      var result = await _learningRequestService.CreateAsync(GetCurrentUserId(), dto);
      return this.CreatedResponse(
        $"/api/learning-requests/{result.Id}",
        ApiResponse<LearningRequestDto>.SuccessResult(result, "Tạo yêu cầu học tập thành công."));
    }

    [HttpGet("me")]
    [Authorize(Roles = "Student")]
    [SwaggerOperation(OperationId = "getMyLearningRequests")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<LearningRequestDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<PagedResult<LearningRequestDto>>>> GetMyRequests([FromQuery] LearningRequestQueryParameters parameters)
    {
      var result = await _learningRequestService.GetMyRequestsAsync(GetCurrentUserId(), parameters);
      return this.OkResponse(ApiResponse<PagedResult<LearningRequestDto>>.SuccessResult(result));
    }

    [HttpGet("{id:long}")]
    [Authorize(Roles = "Student")]
    [SwaggerOperation(OperationId = "getLearningRequestById")]
    [ProducesResponseType(typeof(ApiResponse<LearningRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<LearningRequestDto>>> GetById(long id)
    {
      var result = await _learningRequestService.GetByIdAsync(id, GetCurrentUserId());
      return this.OkResponse(ApiResponse<LearningRequestDto>.SuccessResult(result));
    }

    [HttpGet("{learningRequestId:long}/schedule-proposal")]
    [Authorize(Roles = "Student,Tutor,Admin")]
    [SwaggerOperation(OperationId = "getScheduleProposalByLearningRequest")]
    [ProducesResponseType(typeof(ApiResponse<ScheduleProposalDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<ScheduleProposalDto>>> GetScheduleProposal(long learningRequestId)
    {
      var result = await _scheduleProposalService.GetByLearningRequestIdAsync(
        learningRequestId,
        GetCurrentUserId(),
        GetCurrentUserRole(),
        TryGetCurrentTutorId());

      return this.OkResponse(ApiResponse<ScheduleProposalDto>.SuccessResult(result));
    }

    [HttpGet("incoming")]
    [Authorize(Roles = "Tutor")]
    [SwaggerOperation(OperationId = "getIncomingLearningRequests")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<LearningRequestDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<PagedResult<LearningRequestDto>>>> GetIncomingRequests([FromQuery] LearningRequestQueryParameters parameters)
    {
      var result = await _tutorLearningRequestService.GetIncomingRequestsAsync(GetCurrentTutorId(), parameters);
      return this.OkResponse(ApiResponse<PagedResult<LearningRequestDto>>.SuccessResult(result));
    }

    [HttpPut("{id:long}/accept")]
    [Authorize(Roles = "Tutor")]
    [SwaggerOperation(OperationId = "acceptLearningRequest")]
    [ProducesResponseType(typeof(ApiResponse<LearningRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<LearningRequestDto>>> Accept(long id)
    {
      var result = await _tutorLearningRequestService.AcceptAsync(id, GetCurrentTutorId());
      return this.OkResponse(ApiResponse<LearningRequestDto>.SuccessResult(result, "Chấp nhận yêu cầu học tập thành công."));
    }

    [HttpPut("{id:long}/reject")]
    [Authorize(Roles = "Tutor")]
    [SwaggerOperation(OperationId = "rejectLearningRequest")]
    [ProducesResponseType(typeof(ApiResponse<LearningRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<LearningRequestDto>>> Reject(long id)
    {
      var result = await _tutorLearningRequestService.RejectAsync(id, GetCurrentTutorId());
      return this.OkResponse(ApiResponse<LearningRequestDto>.SuccessResult(result, "Từ chối yêu cầu học tập thành công."));
    }

    private long GetCurrentUserId()
    {
      var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!long.TryParse(userIdClaim, out var userId))
      {
        throw new UnauthorizedException("Không thể xác thực người dùng.");
      }

      return userId;          
    }

    private long GetCurrentTutorId()
    {
      var tutorIdClaim = User.FindFirstValue("tutorId");
      if (!long.TryParse(tutorIdClaim, out var tutorId))
      {
        throw new UnauthorizedException("Không thể xác thực gia sư.");
      }

      return tutorId;
    }

    private long? TryGetCurrentTutorId()
    {
      var tutorIdClaim = User.FindFirstValue("tutorId");
      return long.TryParse(tutorIdClaim, out var tutorId) ? tutorId : null;
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
}
