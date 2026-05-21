using EduMatch.DTOs.ScheduleProposals;

namespace EduMatch.Services.Interfaces
{
  public interface IScheduleProposalService
  {
    Task<ScheduleProposalDto> CreateAsync(long tutorProfileId, CreateScheduleProposalDto dto);
    Task<ScheduleProposalDto> AcceptAsync(long id, long currentUserId);
    Task<ScheduleProposalDto> RejectAsync(long id, long currentUserId);
  }
}
