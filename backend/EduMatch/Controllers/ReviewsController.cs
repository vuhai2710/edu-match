using EduMatch.Common.Exception;
using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.DTOs.Review;
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
    [ProducesResponseType(typeof(ApiResponse<ReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ReviewDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<ReviewDto>>> CreateReview([FromBody] CreateReviewDto dto)
    {
      var result = await _reviewService.CreateReviewAsync(GetCurrentUserId(), dto);
      if (!result.Success)
      {
        return this.OkResponse(result);
      }

      return this.CreatedResponse($"/api/reviews/{result.Data!.Id}", result);
    }

    [HttpGet("tutor/{tutorId}")]
    [SwaggerOperation(OperationId = "getReviewsByTutorId")]
    [ProducesResponseType(typeof(ApiResponse<List<ReviewDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<List<ReviewDto>>>> GetReviewsByTutorId(long tutorId)
    {
      return this.OkResponse(await _reviewService.GetReviewsByTutorIdAsync(tutorId));
    }

    [HttpGet("class/{classId}")]
    [SwaggerOperation(OperationId = "getReviewByClassId")]
    [ProducesResponseType(typeof(ApiResponse<ReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<ReviewDto>>> GetReviewByClassId(long classId)
    {
      return this.OkResponse(await _reviewService.GetReviewByClassIdAsync(classId));
    }

    private long GetCurrentUserId()
    {
      return User.GetRequiredUserId();
    }
  }
}
