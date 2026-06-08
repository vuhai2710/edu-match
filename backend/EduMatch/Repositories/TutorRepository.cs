using EduMatch.Data;
using EduMatch.DTOs;
using EduMatch.DTOs.Recommendations;
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

    public async Task<PagedResult<Tutor>> GetTutorsAsync(TutorQueryParameters parameters, bool isAdmin = false)
    {
      var query = _dbSet
        .Include(t => t.User)
          .ThenInclude(u => u.AvatarFile)
        .Include(t => t.Address)
        .Include(t => t.TeachingLevels)
        .Include(t => t.TutorSubjects)
          .ThenInclude(ts => ts.Subject)
        .Where(t => t.User != null && !t.User.IsDeleted)
        .AsQueryable();

      if (!isAdmin)
      {
        query = query.Where(t => t.ApprovalStatus == EduMatch.Common.Enums.TutorApprovalStatus.Approved);
      }

      if (!string.IsNullOrWhiteSpace(parameters.SearchTerm))
      {
        var searchTerm = parameters.SearchTerm.ToLower().Trim();
        var exactTerm = parameters.SearchTerm.Trim();
        query = query.Where(t =>
            t.Code == exactTerm ||
            (t.User.FullName != null && t.User.FullName.ToLower().Contains(searchTerm)) ||
            (t.Profile != null && t.Profile.ToLower().Contains(searchTerm)) ||
            (t.Major != null && t.Major.ToLower().Contains(searchTerm)));
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

      if (parameters.MinPrice.HasValue)
      {
        query = query.Where(t => t.HourlyRate >= parameters.MinPrice.Value);
      }

      if (parameters.MaxPrice.HasValue)
      {
        query = query.Where(t => t.HourlyRate <= parameters.MaxPrice.Value);
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
        .Skip((parameters.Page - 1) * parameters.PageSize)
        .Take(parameters.PageSize)
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

    public async Task<List<Tutor>> GetRecommendationCandidatesAsync(TutorRecommendationQueryParameters parameters, int rankingLimit)
    {
      var query = _dbSet
        .Include(t => t.User)
          .ThenInclude(u => u.AvatarFile)
        .Include(t => t.Address)
        .Include(t => t.TeachingLevels)
        .Include(t => t.TutorSubjects)
          .ThenInclude(ts => ts.Subject)
        .Where(t =>
          !t.IsDeleted &&
          t.ApprovalStatus == EduMatch.Common.Enums.TutorApprovalStatus.Approved &&
          t.User != null &&
          !t.User.IsDeleted)
        .AsQueryable();

      if (parameters.SubjectId.HasValue)
      {
        query = query.Where(t => t.TutorSubjects.Any(ts => ts.SubjectId == parameters.SubjectId.Value));
      }

      if (parameters.ProvinceId.HasValue)
      {
        query = query.Where(t => t.Address != null && t.Address.ProvinceId == parameters.ProvinceId.Value);
      }

      if (!string.IsNullOrWhiteSpace(parameters.WardCode))
      {
        query = query.Where(t => t.Address != null && t.Address.WardCode == parameters.WardCode);
      }

      if (parameters.MinPrice.HasValue)
      {
        query = query.Where(t => t.HourlyRate >= parameters.MinPrice.Value);
      }

      if (parameters.MaxPrice.HasValue)
      {
        query = query.Where(t => t.HourlyRate <= parameters.MaxPrice.Value);
      }

      if (!string.IsNullOrWhiteSpace(parameters.SearchTerm))
      {
        var searchTerm = parameters.SearchTerm.ToLower().Trim();
        var exactTerm = parameters.SearchTerm.Trim();
        query = query.Where(t =>
          t.Code == exactTerm ||
          (t.User.FullName != null && t.User.FullName.ToLower().Contains(searchTerm)) ||
          (t.Profile != null && t.Profile.ToLower().Contains(searchTerm)) ||
          (t.Major != null && t.Major.ToLower().Contains(searchTerm)));
      }

      return await query
        .OrderByDescending(t => t.Rating)
        .ThenByDescending(t => t.TotalReviews)
        .ThenByDescending(t => t.CreatedAt)
        .ThenBy(t => t.Id)
        .Take(rankingLimit)
        .ToListAsync();
    }

    public async Task<Tutor?> GetTutorProfileDetailAsync(long id)
    {
      return await _dbSet
        .Include(t => t.User)
          .ThenInclude(u => u.AvatarFile)
        .Include(t => t.Address)
        .Include(t => t.CvFile)
        .Include(t => t.TeachingLevels)
        .Include(t => t.TutorSubjects)
          .ThenInclude(ts => ts.Subject)
        .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);
    }

    public async Task<Tutor?> GetTutorProfileDetailByCodeAsync(string code)
    {
      var normalizedCode = code.Trim().ToUpper();

      return await _dbSet
        .Include(t => t.User)
          .ThenInclude(u => u.AvatarFile)
        .Include(t => t.Address)
        .Include(t => t.CvFile)
        .Include(t => t.TeachingLevels)
        .Include(t => t.TutorSubjects)
          .ThenInclude(ts => ts.Subject)
        .FirstOrDefaultAsync(t => !t.IsDeleted && t.Code.ToUpper() == normalizedCode);
    }

    public async Task<Tutor?> GetTutorProfileByUserIdAsync(long userId)
    {
      return await _dbSet
        .Include(t => t.User)
          .ThenInclude(u => u.AvatarFile)
        .Include(t => t.Address)
        .Include(t => t.CvFile)
        .Include(t => t.TeachingLevels)
        .Include(t => t.TutorSubjects)
          .ThenInclude(ts => ts.Subject)
        .FirstOrDefaultAsync(t => t.UserId == userId);
    }
  }
}
