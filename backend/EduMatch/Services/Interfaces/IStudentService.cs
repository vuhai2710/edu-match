using EduMatch.DTOs;
using EduMatch.DTOs.StudentProfile;

namespace EduMatch.Services.Interfaces
{
  public interface IStudentService
  {
    Task<PagedResult<StudentDto>> GetStudentsAsync(StudentQueryParameters parameters);
    Task<StudentDetailDto> GetStudentByIdAsync(long studentId);
    Task<StudentDetailDto> GetMyProfileAsync(long currentUserId);
    Task<StudentDetailDto> UpdateMyProfileAsync(long currentUserId, UpdateStudentDto dto);
  }
}
