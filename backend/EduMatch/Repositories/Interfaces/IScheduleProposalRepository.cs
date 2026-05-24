using EduMatch.Models;

namespace EduMatch.Repositories.Interfaces
{
  public interface IScheduleProposalRepository : IRepository<ScheduleProposal>
  {
    Task<ScheduleProposal?> GetByIdWithDetailsAsync(long id);
    Task<ScheduleProposal?> GetByLearningRequestIdAsync(long learningRequestId);
  }
}
