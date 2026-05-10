using EduMatch.Data;
using EduMatch.DTOs;
using EduMatch.DTOs.User;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Repositories
{
  public class UserRepository : Repository<User>, IUserRepository
  {
    public UserRepository(AppDbContext context) : base(context)
    {
    }

    public override async Task<User?> GetByIdAsync(long id)
    {
      return await _dbSet
        .Include(u => u.AvatarFile)
        .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
      return await _dbSet
        .Include(u => u.AvatarFile)
        .FirstOrDefaultAsync(u => u.Email == email.ToLower().Trim());
    }

    public async Task<User?> GetByEmailWithProfilesAsync(string email)
    {
      return await _dbSet
        .Include(u => u.AvatarFile)
        .Include(u => u.TutorProfile)
        .Include(u => u.StudentProfile)
        .FirstOrDefaultAsync(u => u.Email == email.ToLower().Trim());
    }

    public async Task<User?> GetByIdWithProfilesAsync(long id)
    {
      return await _dbSet
        .Include(u => u.AvatarFile)
        .Include(u => u.TutorProfile)
        .Include(u => u.StudentProfile)
        .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User?> GetByRefreshTokenWithProfilesAsync(string refreshToken)
    {
      return await _dbSet
        .Include(u => u.AvatarFile)
        .Include(u => u.TutorProfile)
        .Include(u => u.StudentProfile)
        .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);
    }

    public async Task<PagedResult<User>> GetUsersWithPaginationAsync(UserQueryParameters parameters)
    {
      var query = _dbSet
        .Include(u => u.AvatarFile)
        .AsQueryable();

      if (!string.IsNullOrWhiteSpace(parameters.SearchTerm))
      {
        var searchTerm = parameters.SearchTerm.ToLower().Trim();
        query = query.Where(u =>
            (u.FullName != null && u.FullName.ToLower().Contains(searchTerm)) ||
            (u.Email != null && u.Email.ToLower().Contains(searchTerm)) ||
            (u.PhoneNumber != null && u.PhoneNumber.Contains(searchTerm)));
      }

      if (parameters.Role.HasValue)
      {
        query = query.Where(u => u.Role == parameters.Role.Value);
      }

      if (parameters.IsActive.HasValue)
      {
        query = query.Where(u => u.IsActive == parameters.IsActive.Value);
      }

      var isDescending = string.Equals(parameters.SortDirection, "desc", StringComparison.OrdinalIgnoreCase);
      if (!string.IsNullOrWhiteSpace(parameters.SortColumn))
      {
        query = parameters.SortColumn.ToLower() switch
        {
          "email" => isDescending ? query.OrderByDescending(u => u.Email) : query.OrderBy(u => u.Email),
          "fullname" => isDescending ? query.OrderByDescending(u => u.FullName) : query.OrderBy(u => u.FullName),
          "createdat" => isDescending ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt),
          _ => query.OrderByDescending(u => u.CreatedAt)
        };
      }
      else
      {
        query = query.OrderByDescending(u => u.CreatedAt);
      }

      var totalCount = await query.CountAsync();

      var users = await query
        .Skip((parameters.Page - 1) * parameters.PageSize)
        .Take(parameters.PageSize)
        .ToListAsync();

      return new PagedResult<User>
      {
        Items = users,
        TotalCount = totalCount,
        Page = parameters.Page,
        PageSize = parameters.PageSize,
        TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)parameters.PageSize)
      };
    }
  }
}
