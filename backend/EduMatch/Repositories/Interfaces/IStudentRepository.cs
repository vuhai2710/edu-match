using EduMatch.DTOs;
using EduMatch.Models;

namespace EduMatch.Repositories.Interfaces
{
  public interface IStudentRepository : IRepository<Student>
  {
    Task<PagedResponse<Student>> GetStudentsAsync(int pageNumber, int pageSize);
    Task<Student?> GetStudentDetailAsync(long userId);
  }
}
