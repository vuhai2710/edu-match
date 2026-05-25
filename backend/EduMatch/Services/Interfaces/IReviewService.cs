using EduMatch.DTOs.Review;

namespace EduMatch.Services.Interfaces
{
  public interface IReviewService
  {
    Task<ReviewDto> CreateReviewAsync(long userId, CreateReviewDto dto);
    Task<ReviewEligibilityDto> GetEligibilityAsync(long userId, long classId);
    Task<List<ReviewDto>> GetReviewsByTutorIdAsync(long tutorId);
  }
}
