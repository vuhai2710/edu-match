using EduMatch.Data;
using EduMatch.DTOs;
using EduMatch.DTOs.StudentProfile;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Repositories
{
  public class StudentRepository : Repository<Student>, IStudentRepository
  {
    public StudentRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<PagedResult<Student>> GetStudentsAsync(StudentQueryParameters parameters)
    {
      var query = _dbSet
          .Include(s => s.User)
            .ThenInclude(u => u.AvatarFile)
          .Include(s => s.Address)
          .AsQueryable();

      query = query.Where(s => s.User.IsActive);

      if (!string.IsNullOrWhiteSpace(parameters.SearchTerm))
      {
          var searchTerm = parameters.SearchTerm.ToLower().Trim();
          query = query.Where(s => 
              (s.User.FullName != null && s.User.FullName.ToLower().Contains(searchTerm)) ||
              (s.GradeLevel != null && s.GradeLevel.ToLower().Contains(searchTerm)));
      }

      if (parameters.ProvinceId.HasValue)
      {
          query = query.Where(s => s.Address != null && s.Address.ProvinceId == parameters.ProvinceId.Value);
      }

      if (!string.IsNullOrWhiteSpace(parameters.WardCode))
      {
          query = query.Where(s => s.Address != null && s.Address.WardCode == parameters.WardCode);
      }

      var isDescending = string.Equals(parameters.SortDirection, "desc", StringComparison.OrdinalIgnoreCase);
      if (!string.IsNullOrWhiteSpace(parameters.SortColumn))
      {
          query = parameters.SortColumn.ToLower() switch
          {
              "createdat" => isDescending ? query.OrderByDescending(s => s.CreatedAt) : query.OrderBy(s => s.CreatedAt),
              _ => query.OrderByDescending(s => s.CreatedAt) // Default sorting
          };
      }
      else
      {
          query = query.OrderByDescending(s => s.CreatedAt); // Default sorting
      }

      var totalRecords = await query.CountAsync();
      var data = await query
          .Skip((parameters.PageNumber - 1) * parameters.PageSize)
          .Take(parameters.PageSize)
          .ToListAsync();

      return new PagedResult<Student>
      {
          Items = data,
          Page = parameters.PageNumber,
          PageSize = parameters.PageSize,
          TotalCount = totalRecords,
          TotalPages = totalRecords == 0 ? 0 : (int)Math.Ceiling(totalRecords / (double)parameters.PageSize)
      };
    }

    public async Task<Student?> GetStudentDetailAsync(long userId)
    {
      return await _dbSet
          .Include(s => s.User)
            .ThenInclude(u => u.AvatarFile)
          .FirstOrDefaultAsync(s => s.UserId == userId && s.User.IsActive);
    }
  }
}
