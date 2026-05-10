using System.Security.Claims;
using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.DTOs.Review;
using EduMatch.Common.Exception;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

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
    [SwaggerOperation(OperationId = "createReview")]
    [ProducesResponseType(typeof(ApiResponse<ReviewDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<ReviewDto>>> CreateReview([FromBody] CreateReviewDto dto)
    {
      var result = await _reviewService.CreateReviewAsync(GetCurrentUserId(), dto);
      var response = ApiResponse<ReviewDto>.SuccessResult(result, "Đánh giá thành công.");
      return this.CreatedResponse($"/api/reviews/{result.Id}", response);
    }

    [HttpGet("tutor/{tutorId}")]
    [SwaggerOperation(OperationId = "getReviewsByTutorId")]
    [ProducesResponseType(typeof(ApiResponse<List<ReviewDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<List<ReviewDto>>>> GetReviewsByTutorId(long tutorId)
    {
      var result = await _reviewService.GetReviewsByTutorIdAsync(tutorId);
      return this.OkResponse(ApiResponse<List<ReviewDto>>.SuccessResult(result));
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
  }
}
