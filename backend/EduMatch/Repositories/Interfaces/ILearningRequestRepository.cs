using EduMatch.DTOs;
using EduMatch.DTOs.LearningRequests;
using EduMatch.Models;

namespace EduMatch.Repositories.Interfaces
{
  public interface ILearningRequestRepository : IRepository<LearningRequest>
  {
    Task<LearningRequest?> GetByIdWithDetailsAsync(long id);
    Task<PagedResult<LearningRequest>> GetByStudentIdAsync(long studentId, LearningRequestQueryParameters parameters);
    Task<PagedResult<LearningRequest>> GetByTutorProfileIdAsync(long tutorProfileId, LearningRequestQueryParameters parameters);
  }
}
