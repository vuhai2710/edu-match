using EduMatch.Common.Enums;
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
    [ProducesResponseType(typeof(ApiResponse<LearningRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<LearningRequestDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<LearningRequestDto>>> Create([FromBody] CreateLearningRequestDto dto)
    {
      var result = await _learningRequestService.CreateAsync(GetCurrentUserId(), dto);
      if (!result.Success)
      {
        return this.OkResponse(result);
      }

      return this.CreatedResponse($"/api/learning-requests/{result.Data!.Id}", result);
    }

    [HttpGet("me")]
    [Authorize(Roles = "Student")]
    [SwaggerOperation(OperationId = "getMyLearningRequests")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<LearningRequestDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<PagedResult<LearningRequestDto>>>> GetMyRequests([FromQuery] LearningRequestQueryParameters parameters)
    {
      return this.OkResponse(await _learningRequestService.GetMyRequestsAsync(GetCurrentUserId(), parameters));
    }

    [HttpGet("{id:long}")]
    [Authorize(Roles = "Student,Tutor,Admin")]
    [SwaggerOperation(OperationId = "getLearningRequestById")]
    [ProducesResponseType(typeof(ApiResponse<LearningRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<LearningRequestDto>>> GetById(long id)
    {
      return this.OkResponse(await _learningRequestService.GetByIdAsync(
        id,
        GetCurrentUserId(),
        GetCurrentUserRole(),
        TryGetCurrentTutorId()));
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
      return this.OkResponse(await _scheduleProposalService.GetByLearningRequestIdAsync(
        learningRequestId,
        GetCurrentUserId(),
        GetCurrentUserRole(),
        TryGetCurrentTutorId()));
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
    public async Task<ActionResult<ApiResponse<LearningRequestDto>>> Accept(long id)
    {
      return this.OkResponse(await _tutorLearningRequestService.AcceptAsync(id, GetCurrentTutorId()));
    }

    [HttpPut("{id:long}/reject")]
    [Authorize(Roles = "Tutor")]
    [SwaggerOperation(OperationId = "rejectLearningRequest")]
    [ProducesResponseType(typeof(ApiResponse<LearningRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<LearningRequestDto>>> Reject(long id)
    {
      return this.OkResponse(await _tutorLearningRequestService.RejectAsync(id, GetCurrentTutorId()));
    }

    private long GetCurrentUserId()
    {
      return User.GetRequiredUserId();
    }

    private long GetCurrentTutorId()
    {
      return User.GetRequiredTutorId();
    }

    private long? TryGetCurrentTutorId()
    {
      return User.TryGetLongClaim("tutorId");
    }

    private UserRole GetCurrentUserRole()
    {
      return User.GetRequiredUserRole();
    }
  }
}
