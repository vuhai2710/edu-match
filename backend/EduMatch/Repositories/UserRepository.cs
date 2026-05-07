using EduMatch.Data;
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

    public async Task<User?> GetByEmailAsync(string email)
    {
      return await _dbSet.FirstOrDefaultAsync(u => u.Email == email.ToLower().Trim());
    }

    public async Task<(IEnumerable<User>, int)> GetUsersWithPaginationAsync(int pageNumber, int pageSize)
    {
      var query = _dbSet.AsQueryable();
      var totalCount = await query.CountAsync();
      
      var users = await query
        .Skip((pageNumber - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

      return (users, totalCount);
    }
  }
}
