using EduMatch.Common.Enums;
using EduMatch.DTOs;
using EduMatch.DTOs.ScheduleProposals;

namespace EduMatch.Services.Interfaces
{
  public interface IScheduleProposalService
  {
    Task<ScheduleProposalDto> CreateAsync(long tutorProfileId, CreateScheduleProposalDto dto);
    Task<ScheduleProposalDto> GetByIdAsync(long id, long currentUserId, UserRole role, long? tutorProfileId = null);
    Task<ScheduleProposalDto> GetByLearningRequestIdAsync(long learningRequestId, long currentUserId, UserRole role, long? tutorProfileId = null);
    Task<ApiResponse<ScheduleProposalDto>> AcceptAsync(long id, long currentUserId);
    Task<ApiResponse<ScheduleProposalDto>> RejectAsync(long id, long currentUserId);
  }
}
