using EduMatch.DTOs;
using EduMatch.DTOs.LearningRequests;
using EduMatch.Common.Enums;

namespace EduMatch.Services.Interfaces
{
  public interface ILearningRequestService
  {
    Task<LearningRequestDto> CreateAsync(long currentUserId, CreateLearningRequestDto dto);
    Task<PagedResult<LearningRequestDto>> GetMyRequestsAsync(long currentUserId, LearningRequestQueryParameters parameters);
    Task<LearningRequestDto> GetByIdAsync(long id, long currentUserId, UserRole role, long? tutorProfileId = null);
  }
}

