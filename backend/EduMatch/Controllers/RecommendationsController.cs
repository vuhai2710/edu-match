using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.DTOs.Recommendations;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace EduMatch.Controllers
{
  [Route("api/recommendations")]
  [ApiController]
  public class RecommendationsController : ControllerBase
  {
    private readonly IRecommendationService _recommendationService;

    public RecommendationsController(IRecommendationService recommendationService)
    {
      _recommendationService = recommendationService;
    }

    [HttpGet("tutors")]
    [Authorize(Roles = "Student")]
    [SwaggerOperation(OperationId = "getTutorRecommendations")]
    [ProducesResponseType(typeof(ApiResponse<TutorRecommendationListDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<TutorRecommendationListDto>>> GetTutorRecommendations(
      [FromQuery] TutorRecommendationQueryParameters parameters)
    {
      return this.OkResponse(await _recommendationService.GetTutorRecommendationsAsync(
        User.GetRequiredUserId(),
        parameters));
    }
  }
}

