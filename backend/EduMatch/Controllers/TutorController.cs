using EduMatch.DTOs;
using EduMatch.DTOs.Tutor;
using EduMatch.Exception;
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
    public async Task<ActionResult<ApiResponse<PagedResult<TutorDto>>>> GetTutors([FromQuery] TutorQueryParameters parameters)
    {
      var result = await _tutorService.GetTutorsAsync(parameters);
      return Ok(ApiResponse<PagedResult<TutorDto>>.SuccessResult(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<TutorDetailDto>>> GetTutorById(long id)
    {
      var result = await _tutorService.GetTutorByIdAsync(id);
      return Ok(ApiResponse<TutorDetailDto>.SuccessResult(result));
    }

    [HttpGet("me")]
    [Authorize(Roles = "Tutor")]
    public async Task<ActionResult<ApiResponse<TutorDetailDto>>> GetCurrentTutorProfile()
    {
      var result = await _tutorService.GetTutorByUserIdAsync(GetCurrentUserId());
      return Ok(ApiResponse<TutorDetailDto>.SuccessResult(result));
    }

    [HttpPut("me")]
    [Authorize(Roles = "Tutor")]
    public async Task<ActionResult<ApiResponse<TutorDetailDto>>> UpdateCurrentTutorProfile([FromBody] UpdateTutorDto dto)
    {
      var result = await _tutorService.UpdateTutorProfileAsync(GetCurrentUserId(), dto);
      return Ok(ApiResponse<TutorDetailDto>.SuccessResult(result, "Tutor profile updated successfully"));
    }

    [HttpPut("me/cv")]
    [Authorize(Roles = "Tutor")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<FileDto>>> UpdateMyCv(IFormFile file)
    {
      var result = await _tutorService.UpdateCvAsync(GetCurrentUserId(), file);
      return Ok(ApiResponse<FileDto>.SuccessResult(result, "Cập nhật CV thành công"));
    }

    private long GetCurrentUserId()
    {
      var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!long.TryParse(userIdClaim, out var userId))
      {
        throw new AppException("Không thể xác thực người dùng", 401);
      }

      return userId;
    }
  }
}
