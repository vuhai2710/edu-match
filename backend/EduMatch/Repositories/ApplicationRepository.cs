using EduMatch.Common.Enums;
using EduMatch.Data;
using EduMatch.DTOs;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Repositories
{
  public class ApplicationRepository : Repository<Application>, IApplicationRepository
  {
    public ApplicationRepository(AppDbContext context) : base(context)
    {
    }

    public override async Task<Application?> GetByIdAsync(long id)
    {
      return await _dbSet
        .Include(x => x.Tutor)
          .ThenInclude(x => x.User)
            .ThenInclude(x => x.AvatarFile)
        .Include(x => x.TutorRequest)
          .ThenInclude(x => x.Student)
            .ThenInclude(x => x.AvatarFile)
        .Include(x => x.TutorRequest)
          .ThenInclude(x => x.Subject)
        .Include(x => x.TutorRequest)
          .ThenInclude(x => x.Address)
        .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<Application?> GetByTutorAndRequestAsync(long tutorProfileId, long requestId)
    {
      return await _dbSet
        .Include(x => x.Tutor)
          .ThenInclude(x => x.User)
            .ThenInclude(x => x.AvatarFile)
        .Include(x => x.TutorRequest)
          .ThenInclude(x => x.Student)
            .ThenInclude(x => x.AvatarFile)
        .FirstOrDefaultAsync(x => x.TutorId == tutorProfileId && x.TutorRequestId == requestId);
    }

    public async Task<PagedResult<Application>> GetByRequestIdAsync(long requestId, int page, int pageSize)
    {
      page = page <= 0 ? 1 : page;
      pageSize = pageSize <= 0 ? 10 : Math.Min(pageSize, 100);

      var query = _dbSet
        .Include(x => x.Tutor)
          .ThenInclude(x => x.User)
            .ThenInclude(x => x.AvatarFile)
        .Where(x => x.TutorRequestId == requestId)
        .OrderByDescending(x => x.CreatedAt);

      var totalCount = await query.CountAsync();
      var items = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

      return new PagedResult<Application>
      {
        Items = items,
        TotalCount = totalCount,
        Page = page,
        PageSize = pageSize,
        TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize)
      };
    }

    public async Task<PagedResult<Application>> GetByTutorProfileIdAsync(long tutorProfileId, int page, int pageSize)
    {
      page = page <= 0 ? 1 : page;
      pageSize = pageSize <= 0 ? 10 : Math.Min(pageSize, 100);

      var query = _dbSet
        .Include(x => x.Tutor)
          .ThenInclude(x => x.User)
            .ThenInclude(x => x.AvatarFile)
        .Include(x => x.TutorRequest)
          .ThenInclude(x => x.Student)
            .ThenInclude(x => x.AvatarFile)
        .Include(x => x.TutorRequest)
          .ThenInclude(x => x.Subject)
        .Where(x => x.TutorId == tutorProfileId)
        .OrderByDescending(x => x.CreatedAt);

      var totalCount = await query.CountAsync();
      var items = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

      return new PagedResult<Application>
      {
        Items = items,
        TotalCount = totalCount,
        Page = page,
        PageSize = pageSize,
        TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize)
      };
    }

    public async Task<PagedResult<Application>> GetAllAsync(int page, int pageSize, ApplicationStatus? status)
    {
      page = page <= 0 ? 1 : page;
      pageSize = pageSize <= 0 ? 10 : Math.Min(pageSize, 100);

      var query = _dbSet
        .Include(x => x.Tutor)
          .ThenInclude(x => x.User)
            .ThenInclude(x => x.AvatarFile)
        .Include(x => x.TutorRequest)
          .ThenInclude(x => x.Student)
            .ThenInclude(x => x.AvatarFile)
        .Include(x => x.TutorRequest)
          .ThenInclude(x => x.Subject)
        .AsQueryable();

      if (status.HasValue)
      {
        query = query.Where(x => x.Status == status.Value);
      }

      query = query.OrderByDescending(x => x.CreatedAt);

      var totalCount = await query.CountAsync();
      var items = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

      return new PagedResult<Application>
      {
        Items = items,
        TotalCount = totalCount,
        Page = page,
        PageSize = pageSize,
        TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize)
      };
    }

    public async Task<Application> CreateAsync(Application application)
    {
      await _dbSet.AddAsync(application);
      await _context.SaveChangesAsync();
      return application;
    }

    public async Task UpdateAsync(Application application)
    {
      _dbSet.Update(application);
      await _context.SaveChangesAsync();
    }
  }
}
