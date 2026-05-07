using EduMatch.Data;
using EduMatch.DTOs;
using EduMatch.Models;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Repositories
{
  public class TutorRepository : Repository<Tutor>, ITutorRepository
  {
    public TutorRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<PagedResponse<Tutor>> GetTutorsAsync(int pageNumber, int pageSize)
    {
      var query = _dbSet
        .Include(t => t.User)
        .Include(t => t.TutorSubjects)
          .ThenInclude(ts => ts.Subject)
        .AsQueryable();

      var totalCount = await query.CountAsync();

      var items = await query
        .Skip((pageNumber - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

      return new PagedResponse<Tutor>
      {
        Items = items,
        TotalCount = totalCount,
        PageNumber = pageNumber,
        PageSize = pageSize
      };
    }

    public async Task<Tutor?> GetTutorProfileDetailAsync(long id)
    {
      return await _dbSet
        .Include(t => t.User)
        .Include(t => t.TutorSubjects)
          .ThenInclude(ts => ts.Subject)
        .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<Tutor?> GetTutorProfileByUserIdAsync(long userId)
    {
      return await _dbSet
        .Include(t => t.User)
        .Include(t => t.TutorSubjects)
          .ThenInclude(ts => ts.Subject)
        .FirstOrDefaultAsync(t => t.UserId == userId);
    }
  }
}
