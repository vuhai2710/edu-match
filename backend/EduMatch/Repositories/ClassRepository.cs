using EduMatch.Common.Enums;
using EduMatch.Data;
using EduMatch.DTOs;
using EduMatch.DTOs.Classes;
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

        public async Task<Class?> GetByIdWithDetailsAsync(long id)
        {
            return await BuildDetailsQuery()
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<PagedResult<Class>> GetPagedWithDetailsAsync(
            ClassQueryParameters parameters,
            long? studentId = null,
            long? tutorId = null)
        {
            var query = BuildDetailsQuery();

            if (studentId.HasValue)
            {
                query = query.Where(c => c.StudentId == studentId.Value);
            }

            if (tutorId.HasValue)
            {
                query = query.Where(c => c.TutorId == tutorId.Value);
            }

            if (parameters.Status.HasValue)
            {
                query = query.Where(c => c.Status == parameters.Status.Value);
            }

            if (parameters.SubjectId.HasValue)
            {
                query = query.Where(c => c.SubjectId == parameters.SubjectId.Value);
            }

            if (parameters.DayOfWeek.HasValue)
            {
                var dayName = parameters.DayOfWeek.Value.ToString();
                var dayFilterJson = $"[{{\"day\":\"{dayName}\"}}]";
                query = query.Where(c =>
                    c.TimeSlotsJson != null &&
                    EF.Functions.JsonContains(c.TimeSlotsJson, dayFilterJson));
            }

            if (!string.IsNullOrWhiteSpace(parameters.SearchTerm))
            {
                var term = parameters.SearchTerm.Trim().ToLower();
                query = query.Where(c =>
                    c.Code.ToLower().Contains(term) ||
                    (c.Subject != null && c.Subject.Name.ToLower().Contains(term)) ||
                    (c.Student != null && c.Student.FullName != null && c.Student.FullName.ToLower().Contains(term)) ||
                    (c.Tutor != null && c.Tutor.User != null && c.Tutor.User.FullName != null && c.Tutor.User.FullName.ToLower().Contains(term)));
            }

            var totalItems = await query.CountAsync();

            var items = await query
                .OrderByDescending(c => c.CreatedAt)
                .Skip((parameters.Page - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .ToListAsync();

            return new PagedResult<Class>
            {
                Items = items,
                TotalCount = totalItems,
                Page = parameters.Page,
                PageSize = parameters.PageSize,
                TotalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)parameters.PageSize)
            };
        }

        private IQueryable<Class> BuildDetailsQuery()
        {
            return _context.Classes
                .Include(c => c.Student)
                .Include(c => c.Tutor)
                    .ThenInclude(t => t.User)
                .Include(c => c.Subject)
                .AsQueryable();
        }
    }
}
