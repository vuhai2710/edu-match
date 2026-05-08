using EduMatch.DTOs;
using EduMatch.DTOs.Tutor;
using EduMatch.Models;

namespace EduMatch.Repositories
{
  public interface ITutorRepository : IRepository<Tutor>
  {
    Task<PagedResult<Tutor>> GetTutorsAsync(TutorQueryParameters parameters);
    Task<Tutor?> GetTutorProfileDetailAsync(long id);
    Task<Tutor?> GetTutorProfileByUserIdAsync(long userId);
  }
}
