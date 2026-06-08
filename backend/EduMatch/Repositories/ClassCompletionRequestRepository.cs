using EduMatch.Common.Enums;
using EduMatch.Data;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Repositories;

public class ClassCompletionRequestRepository : Repository<ClassCompletionRequest>, IClassCompletionRequestRepository
{
  public ClassCompletionRequestRepository(AppDbContext context) : base(context)
  {
  }

  public async Task<bool> HasPendingRequestForClassAsync(long classId)
  {
    return await _dbSet.AnyAsync(x =>
      x.ClassId == classId &&
      x.Status == ClassCompletionRequestStatus.Pending);
  }

  public async Task<ClassCompletionRequest?> GetByIdWithDetailsAsync(long id)
  {
    return await BuildDetailsQuery()
      .FirstOrDefaultAsync(x => x.Id == id);
  }

  public async Task<ClassCompletionRequest?> GetLatestByClassIdWithDetailsAsync(long classId)
  {
    return await BuildDetailsQuery()
      .Where(x => x.ClassId == classId)
      .OrderByDescending(x => x.CreatedAt)
      .FirstOrDefaultAsync();
  }

  private IQueryable<ClassCompletionRequest> BuildDetailsQuery()
  {
    return _dbSet
      .Include(x => x.Class)
        .ThenInclude(x => x.Student)
      .Include(x => x.Class)
        .ThenInclude(x => x.Tutor)
          .ThenInclude(x => x.User)
      .Include(x => x.RequestedByUser)
      .Include(x => x.RespondedByUser)
      .AsQueryable();
  }
}
