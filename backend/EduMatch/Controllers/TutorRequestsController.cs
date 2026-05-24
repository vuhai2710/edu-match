using EduMatch.Common.Exception;
using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.DTOs.TutorRequests;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Swashbuckle.AspNetCore.Annotations;

namespace EduMatch.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  public class TutorRequestsController : ControllerBase
  {
    private readonly ITutorRequestService _tutorRequestService;

    public TutorRequestsController(ITutorRequestService tutorRequestService)
    {
      _tutorRequestService = tutorRequestService;
    }

    [HttpGet]
    [AllowAnonymous]
    [SwaggerOperation(OperationId = "getTutorRequests")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<TutorRequestResponseDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PagedResult<TutorRequestResponseDto>>>> GetAll([FromQuery] TutorRequestFilterDto filter)
    {
      return this.OkResponse(await _tutorRequestService.GetAllAsync(filter));
    }

    [HttpGet("{id:long}")]
    [AllowAnonymous]
    [SwaggerOperation(OperationId = "getTutorRequestById")]
    [ProducesResponseType(typeof(ApiResponse<TutorRequestResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<TutorRequestResponseDto>>> GetById(long id)
    {
      return this.OkResponse(await _tutorRequestService.GetByIdAsync(id));
    }

    [HttpGet("my")]
    [Authorize(Roles = "Student")]
    [SwaggerOperation(OperationId = "getMyTutorRequests")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<TutorRequestResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<PagedResult<TutorRequestResponseDto>>>> GetMyRequests([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
      return this.OkResponse(await _tutorRequestService.GetMyRequestsAsync(GetCurrentUserId(), page, pageSize));
    }

    [HttpPost]
    [SwaggerOperation(OperationId = "createTutorRequest")]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status410Gone)]
    public ActionResult<ApiResponse<TutorRequestResponseDto>> Create([FromBody] CreateTutorRequestDto dto)
    {
      return LegacyGone();
    }

    [HttpPut("{id:long}")]
    [SwaggerOperation(OperationId = "updateTutorRequest")]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status410Gone)]
    public ActionResult<ApiResponse<TutorRequestResponseDto>> Update(long id, [FromBody] UpdateTutorRequestDto dto)
    {
      return LegacyGone();
    }

    [HttpPut("{id:long}/close")]
    [SwaggerOperation(OperationId = "closeTutorRequest")]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status410Gone)]
    public ActionResult<ApiResponse<bool>> Close(long id)
    {
      return LegacyGone();
    }

    private ObjectResult LegacyGone()
    {
      return StatusCode(StatusCodes.Status410Gone,
        ErrorResponse.Create(
          "Luồng booking cũ đã ngừng. Vui lòng dùng /api/learning-requests và /api/schedule-proposals.",
          "LEGACY_FLOW_DISABLED"));
    }

    private long GetCurrentUserId()
    {
      var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!long.TryParse(userIdClaim, out var userId))
      {
        throw new AppException("Unauthorized", 401);
      }

      return userId;
    }
  }
}
