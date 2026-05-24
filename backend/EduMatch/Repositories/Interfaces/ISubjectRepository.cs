using EduMatch.DTOs;
using EduMatch.DTOs.Subject;
using EduMatch.Models;

namespace EduMatch.Repositories.Interfaces
{
  public interface ISubjectRepository : IRepository<Subject>
  {
    Task<List<Subject>> GetAllActiveSubjectsWithTutorCountAsync();
    Task<PagedResult<Tutor>> GetTutorsBySubjectAsync(long subjectId, TutorBySubjectQueryParameters parameters);
  }
}
