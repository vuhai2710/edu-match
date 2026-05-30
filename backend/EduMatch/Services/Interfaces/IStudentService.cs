using EduMatch.DTOs;
using EduMatch.DTOs.StudentProfile;

namespace EduMatch.Services.Interfaces
{
  public interface IStudentService
  {
    Task<ApiResponse<PagedResult<StudentDto>>> GetStudentsAsync(StudentQueryParameters parameters);
    Task<ApiResponse<StudentDetailDto>> GetStudentByIdAsync(long studentId);
    Task<ApiResponse<StudentDetailDto>> GetMyProfileAsync(long currentUserId);
    Task<ApiResponse<StudentDetailDto>> UpdateMyProfileAsync(long currentUserId, UpdateStudentDto dto);
  }
}
