using EduMatch.DTOs;
using EduMatch.DTOs.LearningRequests;

namespace EduMatch.Services.Interfaces
{
  public interface ILearningRequestService
  {
    Task<LearningRequestDto> CreateAsync(long currentUserId, CreateLearningRequestDto dto);
    Task<PagedResult<LearningRequestDto>> GetMyRequestsAsync(long currentUserId, LearningRequestQueryParameters parameters);
    Task<LearningRequestDto> GetByIdAsync(long id, long currentUserId);
  }
}
