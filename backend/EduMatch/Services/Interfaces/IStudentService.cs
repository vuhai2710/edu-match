using EduMatch.DTOs;
using EduMatch.DTOs.StudentProfile;

namespace EduMatch.Services.Interfaces
{
  public interface IStudentService
  {
    Task<PagedResponse<StudentDto>> GetStudentsAsync(int pageNumber, int pageSize);
    Task<StudentDetailDto> GetStudentByIdAsync(long id);
    Task<StudentDetailDto> GetMyProfileAsync(long currentUserId);
    Task<StudentDetailDto> UpdateMyProfileAsync(long currentUserId, UpdateStudentDto dto);
  }
}
