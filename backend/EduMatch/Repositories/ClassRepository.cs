using EduMatch.Data;
using EduMatch.DTOs;
using EduMatch.Enums;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Repositories
{
    public class ClassRepository : Repository<Class>, IClassRepository
    {
        public ClassRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<PagedResult<Class>> GetPagedAsync(int page, int pageSize, long? studentId, long? tutorId, ClassStatus? status)
        {
            var query = _context.Classes
                .Include(c => c.Student)
                .Include(c => c.Tutor)
                .AsQueryable();

            if (studentId.HasValue)
            {
                query = query.Where(c => c.StudentId == studentId.Value);
            }

            if (tutorId.HasValue)
            {
                query = query.Where(c => c.TutorId == tutorId.Value);
            }

            if (status.HasValue)
            {
                query = query.Where(c => c.Status == status.Value);
            }

            var totalItems = await query.CountAsync();

            var items = await query
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<Class>
            {
                Items = items,
                TotalCount = totalItems,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
            };
        }
    }
}