using EduMatch.DTOs;
using EduMatch.DTOs.Recommendations;

namespace EduMatch.Services.Interfaces
{
  public interface IRecommendationService
  {
    Task<ApiResponse<TutorRecommendationListDto>> GetTutorRecommendationsAsync(
      long currentUserId,
      TutorRecommendationQueryParameters parameters);
  }
}

