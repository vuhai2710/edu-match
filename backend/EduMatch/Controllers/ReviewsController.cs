using EduMatch.DTOs;
using EduMatch.DTOs.Review;
using EduMatch.Exception;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EduMatch.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  public class ReviewsController : ControllerBase
  {
    private readonly IReviewService _reviewService;

    public ReviewsController(IReviewService reviewService)
    {
      _reviewService = reviewService;
    }

    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<ReviewDto>>> CreateReview([FromBody] CreateReviewDto dto)
    {
      var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!long.TryParse(userIdClaim, out var userId))
      {
        throw new AppException("Không thể xác thực người dùng", 401);
      }

      var result = await _reviewService.CreateReviewAsync(userId, dto);
      return Ok(ApiResponse<ReviewDto>.SuccessResult(result, "Đánh giá thành công."));
    }

    [HttpGet("tutor/{tutorId}")]
    public async Task<ActionResult<ApiResponse<List<ReviewDto>>>> GetReviewsByTutorId(long tutorId)
    {
      var result = await _reviewService.GetReviewsByTutorIdAsync(tutorId);
      return Ok(ApiResponse<List<ReviewDto>>.SuccessResult(result));
    }
  }
}
