using EduMatch.Data;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Repositories
{
  public class ScheduleProposalRepository : Repository<ScheduleProposal>, IScheduleProposalRepository
  {
    public ScheduleProposalRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<ScheduleProposal?> GetByIdWithDetailsAsync(long id)
    {
      return await BuildDetailsQuery()
        .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<ScheduleProposal?> GetByLearningRequestIdAsync(long learningRequestId)
    {
      return await BuildDetailsQuery()
        .FirstOrDefaultAsync(x => x.LearningRequestId == learningRequestId);
    }

    private IQueryable<ScheduleProposal> BuildDetailsQuery()
    {
      return _dbSet
        .Include(x => x.LearningRequest)
          .ThenInclude(x => x.Student)
        .Include(x => x.LearningRequest)
          .ThenInclude(x => x.Tutor)
            .ThenInclude(x => x.User)
        .Include(x => x.LearningRequest)
          .ThenInclude(x => x.Subject)
        .Include(x => x.Tutor)
          .ThenInclude(x => x.User)
        .AsQueryable();
    }
  }
}
