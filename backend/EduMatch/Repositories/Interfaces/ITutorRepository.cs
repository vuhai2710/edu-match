using EduMatch.DTOs;
using EduMatch.Models;

namespace EduMatch.Repositories
{
  public interface ITutorRepository : IRepository<Tutor>
  {
    Task<PagedResponse<Tutor>> GetTutorsAsync(int pageNumber, int pageSize, int? provinceId = null, string? wardCode = null);
    Task<Tutor?> GetTutorProfileDetailAsync(long id);
    Task<Tutor?> GetTutorProfileByUserIdAsync(long userId);
  }
}
