using EduMatch.Data;
using EduMatch.DTOs;
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

    public async Task<PagedResponse<Student>> GetStudentsAsync(int pageNumber, int pageSize)
    {
      var query = _dbSet
          .Include(s => s.User)
          .Where(s => s.User.IsActive);

      var totalRecords = await query.CountAsync();
      var totalPages = (int)Math.Ceiling(totalRecords / (double)pageSize);

      var data = await query
          .OrderByDescending(s => s.CreatedAt)
          .Skip((pageNumber - 1) * pageSize)
          .Take(pageSize)
          .ToListAsync();

      return new PagedResponse<Student>
      {
          Items = data,
          PageNumber = pageNumber,
          PageSize = pageSize,
          TotalCount = totalRecords
      };
    }

    public async Task<Student?> GetStudentDetailAsync(long userId)
    {
      return await _dbSet
          .Include(s => s.User)
          .FirstOrDefaultAsync(s => s.UserId == userId && s.User.IsActive);
    }
  }
}
