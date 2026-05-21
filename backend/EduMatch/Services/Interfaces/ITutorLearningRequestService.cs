using EduMatch.DTOs;
using EduMatch.DTOs.LearningRequests;

namespace EduMatch.Services.Interfaces
{
  public interface ITutorLearningRequestService
  {
    Task<PagedResult<LearningRequestDto>> GetIncomingRequestsAsync(long tutorProfileId, LearningRequestQueryParameters parameters);
    Task<LearningRequestDto> AcceptAsync(long id, long tutorProfileId);
    Task<LearningRequestDto> RejectAsync(long id, long tutorProfileId);
  }
}
