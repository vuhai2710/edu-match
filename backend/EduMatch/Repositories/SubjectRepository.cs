using EduMatch.Data;
using EduMatch.DTOs;
using EduMatch.DTOs.Subject;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Repositories
{
  public class SubjectRepository : Repository<Subject>, ISubjectRepository
  {
    public SubjectRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<List<Subject>> GetAllActiveSubjectsWithTutorCountAsync()
    {
      return await _dbSet
        .Include(s => s.TutorSubjects)
        .OrderBy(s => s.Name)
        .AsNoTracking()
        .ToListAsync();
    }

    public async Task<PagedResult<Tutor>> GetTutorsBySubjectAsync(
      long subjectId,
      TutorBySubjectQueryParameters parameters)
    {
      var query = _context.Tutors
        .Include(t => t.User)
          .ThenInclude(u => u.AvatarFile)
        .Include(t => t.TutorSubjects)
          .ThenInclude(ts => ts.Subject)
        .Include(t => t.TeachingLevels)
        .AsQueryable();

      query = query.Where(t => t.TutorSubjects.Any(ts => ts.SubjectId == subjectId));

      query = query.Where(t => t.User.IsActive);

      if (!string.IsNullOrWhiteSpace(parameters.SearchTerm))
      {
        var searchTerm = parameters.SearchTerm.ToLower().Trim();
        query = query.Where(t =>
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
      if (parameters.MinRating.HasValue)
      {
        query = query.Where(t => t.Rating >= parameters.MinRating.Value);
      }

      if (parameters.MaxHourlyRate.HasValue)
      {
        query = query.Where(t => t.HourlyRate <= parameters.MaxHourlyRate.Value);
      }

      var isDescending = string.Equals(parameters.SortDirection, "desc", StringComparison.OrdinalIgnoreCase);
      query = (parameters.SortColumn?.ToLower()) switch
      {
        "rating" => isDescending ? query.OrderByDescending(t => t.Rating) : query.OrderBy(t => t.Rating),
        "hourlyrate" => isDescending ? query.OrderByDescending(t => t.HourlyRate) : query.OrderBy(t => t.HourlyRate),
        "reviews" => isDescending ? query.OrderByDescending(t => t.TotalReviews) : query.OrderBy(t => t.TotalReviews),
        _ => query.OrderByDescending(t => t.Rating)
      };

      var totalCount = await query.CountAsync();

      var items = await query
        .Skip((parameters.Page - 1) * parameters.PageSize)
        .Take(parameters.PageSize)
        .AsNoTracking()
        .ToListAsync();

      return new PagedResult<Tutor>
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
