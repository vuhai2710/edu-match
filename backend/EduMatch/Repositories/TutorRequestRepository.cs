using EduMatch.Common.Enums;
using EduMatch.Data;
using EduMatch.DTOs;
using EduMatch.DTOs.TutorRequests;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Repositories
{
  public class TutorRequestRepository : Repository<TutorRequest>, ITutorRequestRepository
  {
    public TutorRequestRepository(AppDbContext context) : base(context)
    {
    }

    public override async Task<TutorRequest?> GetByIdAsync(long id)
    {
      return await _dbSet
        .Include(x => x.Student)
          .ThenInclude(x => x.AvatarFile)
        .Include(x => x.Subject)
        .Include(x => x.Address)
        .Include(x => x.Applications)
        .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<PagedResult<TutorRequest>> GetAllAsync(TutorRequestFilterDto filter)
    {
      var page = filter.Page <= 0 ? 1 : filter.Page;
      var pageSize = filter.PageSize <= 0 ? 10 : Math.Min(filter.PageSize, 100);
      var utcNow = DateTime.UtcNow;

      var query = _dbSet
        .Include(x => x.Student)
          .ThenInclude(x => x.AvatarFile)
        .Include(x => x.Subject)
        .Include(x => x.Address)
        .Include(x => x.Applications)
        .AsQueryable();

      if (filter.SubjectId.HasValue)
      {
        query = query.Where(x => x.SubjectId == filter.SubjectId.Value);
      }

      if (filter.Status.HasValue)
      {
        query = query.Where(x => x.Status == filter.Status.Value);
      }

      if (filter.PricePerSessionMin.HasValue)
      {
        query = query.Where(x => x.PricePerSession >= filter.PricePerSessionMin.Value);
      }

      if (filter.PricePerSessionMax.HasValue)
      {
        query = query.Where(x => x.PricePerSession <= filter.PricePerSessionMax.Value);
      }

      if (!string.IsNullOrWhiteSpace(filter.Area))
      {
        var area = filter.Area.Trim();
        query = query.Where(x => x.Address != null && EF.Functions.ILike(x.Address.ProvinceName, $"%{area}%"));
      }

      if (!string.IsNullOrWhiteSpace(filter.Keyword))
      {
        var keyword = filter.Keyword.Trim();
        query = query.Where(x => 
            x.Code == keyword ||
            (x.Note != null && EF.Functions.ILike(x.Note, $"%{keyword}%")));
      }

      if (filter.ExcludeExpired)
      {
        query = query.Where(x => x.Status != TutorRequestStatus.Expired && (!x.ExpiresAt.HasValue || x.ExpiresAt.Value >= utcNow));
      }

      query = query.OrderByDescending(x => x.CreatedAt);

      var totalCount = await query.CountAsync();
      var items = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

      return new PagedResult<TutorRequest>
      {
        Items = items,
        TotalCount = totalCount,
        Page = page,
        PageSize = pageSize,
        TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize)
      };
    }

    public async Task<PagedResult<TutorRequest>> GetByStudentIdAsync(long studentId, int page, int pageSize)
    {
      page = page <= 0 ? 1 : page;
      pageSize = pageSize <= 0 ? 10 : Math.Min(pageSize, 100);

      var query = _dbSet
        .Include(x => x.Student)
          .ThenInclude(x => x.AvatarFile)
        .Include(x => x.Subject)
        .Include(x => x.Address)
        .Include(x => x.Applications)
        .Where(x => x.StudentId == studentId)
        .OrderByDescending(x => x.CreatedAt);

      var totalCount = await query.CountAsync();
      var items = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

      return new PagedResult<TutorRequest>
      {
        Items = items,
        TotalCount = totalCount,
        Page = page,
        PageSize = pageSize,
        TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize)
      };
    }

    public async Task<TutorRequest> CreateAsync(TutorRequest request)
    {
      await _dbSet.AddAsync(request);
      await _context.SaveChangesAsync();
      return request;
    }

    public async Task UpdateAsync(TutorRequest request)
    {
      _dbSet.Update(request);
      await _context.SaveChangesAsync();
    }

    public async Task<List<TutorRequest>> GetExpiredOpenRequestsAsync()
    {
      var utcNow = DateTime.UtcNow;
      return await _dbSet
        .Where(x => x.Status == TutorRequestStatus.Open && x.ExpiresAt.HasValue && x.ExpiresAt.Value < utcNow)
        .ToListAsync();
    }
  }
}
