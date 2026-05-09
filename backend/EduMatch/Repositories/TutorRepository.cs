using EduMatch.Data;
using EduMatch.DTOs;
using EduMatch.DTOs.Tutor;
using EduMatch.Models;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Repositories
{
  public class TutorRepository : Repository<Tutor>, ITutorRepository
  {
    public TutorRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<PagedResult<Tutor>> GetTutorsAsync(TutorQueryParameters parameters)
    {
      var query = _dbSet
        .Include(t => t.User)
          .ThenInclude(u => u.AvatarFile)
        .Include(t => t.Address)
        .Include(t => t.TutorSubjects)
          .ThenInclude(ts => ts.Subject)
        .AsQueryable();

      if (!string.IsNullOrWhiteSpace(parameters.SearchTerm))
      {
        var searchTerm = parameters.SearchTerm.ToLower().Trim();
        var exactTerm = parameters.SearchTerm.Trim();
        query = query.Where(t =>
            t.Code == exactTerm ||
            (t.User.FullName != null && t.User.FullName.ToLower().Contains(searchTerm)) ||
            (t.Bio != null && t.Bio.ToLower().Contains(searchTerm)));
      }

      if (parameters.ProvinceId.HasValue)
      {
        query = query.Where(t => t.Address != null && t.Address.ProvinceId == parameters.ProvinceId.Value);
      }

      if (!string.IsNullOrWhiteSpace(parameters.WardCode))
      {
        query = query.Where(t => t.Address != null && t.Address.WardCode == parameters.WardCode);
      }

      if (parameters.SubjectId.HasValue)
      {
        query = query.Where(t => t.TutorSubjects.Any(ts => ts.SubjectId == parameters.SubjectId.Value));
      }

      var isDescending = string.Equals(parameters.SortDirection, "desc", StringComparison.OrdinalIgnoreCase);
      if (!string.IsNullOrWhiteSpace(parameters.SortColumn))
      {
        query = parameters.SortColumn.ToLower() switch
        {
          "rating" => isDescending ? query.OrderByDescending(t => t.Rating) : query.OrderBy(t => t.Rating),
          "hourlyrate" => isDescending ? query.OrderByDescending(t => t.HourlyRate) : query.OrderBy(t => t.HourlyRate),
          "reviews" => isDescending ? query.OrderByDescending(t => t.TotalReviews) : query.OrderBy(t => t.TotalReviews),
          "createdat" => isDescending ? query.OrderByDescending(t => t.CreatedAt) : query.OrderBy(t => t.CreatedAt),
          _ => query.OrderByDescending(t => t.CreatedAt)
        };
      }
      else
      {
        query = query.OrderByDescending(t => t.CreatedAt);
      }

      var totalCount = await query.CountAsync();

      var items = await query
        .Skip((parameters.PageNumber - 1) * parameters.PageSize)
        .Take(parameters.PageSize)
        .ToListAsync();

      return new PagedResult<Tutor>
      {
        Items = items,
        TotalCount = totalCount,
        Page = parameters.PageNumber,
        PageSize = parameters.PageSize,
        TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)parameters.PageSize)
      };
    }

    public async Task<Tutor?> GetTutorProfileDetailAsync(long id)
    {
      return await _dbSet
        .Include(t => t.User)
          .ThenInclude(u => u.AvatarFile)
        .Include(t => t.Address)
        .Include(t => t.CvFile)
        .Include(t => t.TutorSubjects)
          .ThenInclude(ts => ts.Subject)
        .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<Tutor?> GetTutorProfileByUserIdAsync(long userId)
    {
      return await _dbSet
        .Include(t => t.User)
          .ThenInclude(u => u.AvatarFile)
        .Include(t => t.Address)
        .Include(t => t.CvFile)
        .Include(t => t.TutorSubjects)
          .ThenInclude(ts => ts.Subject)
        .FirstOrDefaultAsync(t => t.UserId == userId);
    }
  }
}
