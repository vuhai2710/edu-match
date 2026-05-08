using EduMatch.DTOs;
using EduMatch.DTOs.StudentProfile;
using EduMatch.Models;

namespace EduMatch.Repositories.Interfaces
{
  public interface IStudentRepository : IRepository<Student>
  {
    Task<PagedResult<Student>> GetStudentsAsync(StudentQueryParameters parameters);
    Task<Student?> GetStudentDetailAsync(long userId);
  }
}
