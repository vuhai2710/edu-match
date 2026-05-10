using EduMatch.Common.Enums;
using EduMatch.DTOs;
using EduMatch.Models;

namespace EduMatch.Repositories.Interfaces
{
    public interface IClassRepository : IRepository<Class>
    {
        Task<PagedResult<Class>> GetPagedAsync(int page, int pageSize, long? studentId, long? tutorId, ClassStatus? status);
    }
}