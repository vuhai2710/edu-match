using EduMatch.Common.Exception;
using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.DTOs.TutorRequests;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

    private long GetCurrentUserId()
    {
      return User.GetRequiredUserId();
    }
  }
}
