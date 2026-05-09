using EduMatch.DTOs;
using EduMatch.DTOs.TutorRequests;
using EduMatch.Exception;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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
    public async Task<ActionResult<ApiResponse<PagedResult<TutorRequestResponseDto>>>> GetAll([FromQuery] TutorRequestFilterDto filter)
    {
      return Ok(await _tutorRequestService.GetAllAsync(filter));
    }

    [HttpGet("{id:long}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<TutorRequestResponseDto>>> GetById(long id)
    {
      return Ok(await _tutorRequestService.GetByIdAsync(id));
    }

    [HttpGet("my")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<PagedResult<TutorRequestResponseDto>>>> GetMyRequests([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
      return Ok(await _tutorRequestService.GetMyRequestsAsync(GetCurrentUserId(), page, pageSize));
    }

    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<TutorRequestResponseDto>>> Create([FromBody] CreateTutorRequestDto dto)
    {
      return Ok(await _tutorRequestService.CreateAsync(GetCurrentUserId(), dto));
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<TutorRequestResponseDto>>> Update(long id, [FromBody] UpdateTutorRequestDto dto)
    {
      return Ok(await _tutorRequestService.UpdateAsync(id, GetCurrentUserId(), dto));
    }

    [HttpPut("{id:long}/close")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<bool>>> Close(long id)
    {
      return Ok(await _tutorRequestService.CloseAsync(id, GetCurrentUserId()));
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
