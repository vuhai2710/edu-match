using EduMatch.DTOs;
using EduMatch.DTOs.Recommendations;
using EduMatch.DTOs.Tutor;
using EduMatch.Models;

namespace EduMatch.Repositories
{
  public interface ITutorRepository : IRepository<Tutor>
  {
    Task<PagedResult<Tutor>> GetTutorsAsync(TutorQueryParameters parameters, bool isAdmin = false);
    Task<List<Tutor>> GetRecommendationCandidatesAsync(TutorRecommendationQueryParameters parameters, int rankingLimit);
    Task<Tutor?> GetTutorProfileDetailAsync(long id);
    Task<Tutor?> GetTutorProfileDetailByCodeAsync(string code);
    Task<Tutor?> GetTutorProfileByUserIdAsync(long userId);
  }
}
