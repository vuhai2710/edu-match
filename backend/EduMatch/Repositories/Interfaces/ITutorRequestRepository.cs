using EduMatch.DTOs;
using EduMatch.DTOs.TutorRequests;
using EduMatch.Models;

namespace EduMatch.Repositories.Interfaces
{
  public interface ITutorRequestRepository : IRepository<TutorRequest>
  {
    new Task<TutorRequest?> GetByIdAsync(long id);
    Task<PagedResult<TutorRequest>> GetAllAsync(TutorRequestFilterDto filter);
    Task<PagedResult<TutorRequest>> GetByStudentIdAsync(long studentId, int page, int pageSize);
    Task<TutorRequest> CreateAsync(TutorRequest request);
    Task UpdateAsync(TutorRequest request);
    Task<List<TutorRequest>> GetExpiredOpenRequestsAsync();
  }
}
