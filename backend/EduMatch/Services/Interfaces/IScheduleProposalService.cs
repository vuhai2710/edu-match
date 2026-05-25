using EduMatch.DTOs.ScheduleProposals;
using EduMatch.Common.Enums;

namespace EduMatch.Services.Interfaces
{
  public interface IScheduleProposalService
  {
    Task<ScheduleProposalDto> CreateAsync(long tutorProfileId, CreateScheduleProposalDto dto);
    Task<ScheduleProposalDto> GetByIdAsync(long id, long currentUserId, UserRole role, long? tutorProfileId = null);
    Task<ScheduleProposalDto> GetByLearningRequestIdAsync(long learningRequestId, long currentUserId, UserRole role, long? tutorProfileId = null);
    Task<ScheduleProposalDto> AcceptAsync(long id, long currentUserId);
    Task<ScheduleProposalDto> RejectAsync(long id, long currentUserId);
  }
}
