using EduMatch.DTOs.Review;

namespace EduMatch.Services.Interfaces
{
  public interface IReviewService
  {
    Task<ReviewDto> CreateReviewAsync(long userId, CreateReviewDto dto);
    Task<List<ReviewDto>> GetReviewsByTutorIdAsync(long tutorId);
  }
}
