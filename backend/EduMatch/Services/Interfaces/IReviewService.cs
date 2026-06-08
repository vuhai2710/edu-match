using EduMatch.DTOs;
using EduMatch.DTOs.Review;

namespace EduMatch.Services.Interfaces
{
  public interface IReviewService
  {
    Task<ApiResponse<ReviewDto>> CreateReviewAsync(long userId, CreateReviewDto dto);
    Task<ApiResponse<ReviewEligibilityDto>> GetEligibilityAsync(long userId, long classId);
    Task<ApiResponse<ReviewDto>> GetReviewByClassIdAsync(long classId);
    Task<ApiResponse<List<ReviewDto>>> GetReviewsByTutorIdAsync(long tutorId);
  }
}
