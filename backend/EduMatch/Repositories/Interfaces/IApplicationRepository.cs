using EduMatch.DTOs;
using EduMatch.Enums;
using EduMatch.Models;

namespace EduMatch.Repositories.Interfaces
{
  public interface IApplicationRepository : IRepository<Application>
  {
    new Task<Application?> GetByIdAsync(long id);
    Task<Application?> GetByTutorAndRequestAsync(long tutorProfileId, long requestId);
    Task<PagedResult<Application>> GetByRequestIdAsync(long requestId, int page, int pageSize);
    Task<PagedResult<Application>> GetByTutorProfileIdAsync(long tutorProfileId, int page, int pageSize);
    Task<PagedResult<Application>> GetAllAsync(int page, int pageSize, ApplicationStatus? status);
    Task<Application> CreateAsync(Application application);
    Task UpdateAsync(Application application);
  }
}
