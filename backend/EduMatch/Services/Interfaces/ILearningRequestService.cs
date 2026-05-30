using EduMatch.DTOs;
using EduMatch.DTOs.LearningRequests;
using EduMatch.Common.Enums;

namespace EduMatch.Services.Interfaces
{
  public interface ILearningRequestService
  {
    Task<ApiResponse<LearningRequestDto>> CreateAsync(long currentUserId, CreateLearningRequestDto dto);
    Task<ApiResponse<PagedResult<LearningRequestDto>>> GetMyRequestsAsync(long currentUserId, LearningRequestQueryParameters parameters);
    Task<ApiResponse<LearningRequestDto>> GetByIdAsync(long id, long currentUserId, UserRole role, long? tutorProfileId = null);
  }
}

