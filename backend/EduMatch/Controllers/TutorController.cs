using EduMatch.DTOs;
using EduMatch.DTOs.Tutor;
using EduMatch.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EduMatch.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  public class TutorsController : ControllerBase
  {
    private readonly ITutorService _tutorService;

    public TutorsController(ITutorService tutorService)
    {
      _tutorService = tutorService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResponse<TutorDto>>>> GetTutors(
      [FromQuery] int pageNumber = 1,
      [FromQuery] int pageSize = 10)
    {
      var result = await _tutorService.GetTutorsAsync(pageNumber, pageSize);
      return Ok(ApiResponse<PagedResponse<TutorDto>>.SuccessResult(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<TutorDetailDto>>> GetTutorById(long id)
    {
      var result = await _tutorService.GetTutorByIdAsync(id);
      return Ok(ApiResponse<TutorDetailDto>.SuccessResult(result));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<TutorDetailDto>>> GetCurrentTutorProfile()
    {
      var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
      if (userIdClaim == null || !long.TryParse(userIdClaim, out var userId))
      {
        return Unauthorized(ApiResponse.Fail("Unauthorized"));
      }

      var result = await _tutorService.GetTutorByUserIdAsync(userId);
      return Ok(ApiResponse<TutorDetailDto>.SuccessResult(result));
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<TutorDetailDto>>> UpdateCurrentTutorProfile([FromBody] UpdateTutorDto dto)
    {
      var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
      if (userIdClaim == null || !long.TryParse(userIdClaim, out var userId))
      {
        return Unauthorized(ApiResponse.Fail("Unauthorized"));
      }

      var result = await _tutorService.UpdateTutorProfileAsync(userId, dto);
      return Ok(ApiResponse<TutorDetailDto>.SuccessResult(result, "Tutor profile updated successfully"));
    }
  }
}
