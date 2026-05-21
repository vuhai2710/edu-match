using EduMatch.Data;
using EduMatch.DTOs;
using EduMatch.DTOs.LearningRequests;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Repositories
{
  public class LearningRequestRepository : Repository<LearningRequest>, ILearningRequestRepository
  {
    public LearningRequestRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<LearningRequest?> GetByIdWithDetailsAsync(long id)
    {
      return await _dbSet
        .Include(x => x.Student)
        .Include(x => x.TutorProfile)
          .ThenInclude(x => x.User)
        .Include(x => x.Subject)
        .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<PagedResult<LearningRequest>> GetByStudentIdAsync(long studentId, LearningRequestQueryParameters parameters)
    {
      var query = _dbSet
        .Include(x => x.Student)
        .Include(x => x.TutorProfile)
          .ThenInclude(x => x.User)
        .Include(x => x.Subject)
        .Where(x => x.StudentId == studentId);

      if (parameters.Status.HasValue)
      {
        query = query.Where(x => x.Status == parameters.Status.Value);
      }

      query = query.OrderByDescending(x => x.CreatedAt);

      var totalCount = await query.CountAsync();
      var items = await query
        .Skip((parameters.Page - 1) * parameters.PageSize)
        .Take(parameters.PageSize)
        .ToListAsync();

      return new PagedResult<LearningRequest>
      {
        Items = items,
        TotalCount = totalCount,
        Page = parameters.Page,
        PageSize = parameters.PageSize,
        TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)parameters.PageSize)
      };
    }

    public async Task<PagedResult<LearningRequest>> GetByTutorProfileIdAsync(long tutorProfileId, LearningRequestQueryParameters parameters)
    {
      var query = _dbSet
        .Include(x => x.Student)
        .Include(x => x.TutorProfile)
          .ThenInclude(x => x.User)
        .Include(x => x.Subject)
        .Where(x => x.TutorProfileId == tutorProfileId);

      if (parameters.Status.HasValue)
      {
        query = query.Where(x => x.Status == parameters.Status.Value);
      }

      query = query.OrderByDescending(x => x.CreatedAt);

      var totalCount = await query.CountAsync();
      var items = await query
        .Skip((parameters.Page - 1) * parameters.PageSize)
        .Take(parameters.PageSize)
        .ToListAsync();

      return new PagedResult<LearningRequest>
      {
        Items = items,
        TotalCount = totalCount,
        Page = parameters.Page,
        PageSize = parameters.PageSize,
        TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)parameters.PageSize)
      };
    }
  }
}
