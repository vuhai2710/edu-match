using EduMatch.DTOs;
using EduMatch.DTOs.Classes;

namespace EduMatch.Services.Interfaces;

public interface IClassReadService
{
  Task<ApiResponse<PagedResult<ClassDto>>> GetStudentClassesAsync(long currentUserId, ClassQueryParameters parameters);
  Task<ApiResponse<PagedResult<ClassDto>>> GetTutorClassesAsync(long tutorProfileId, ClassQueryParameters parameters);
  Task<ApiResponse<ClassDto>> GetByIdAsync(long id, long currentUserId, bool isAdmin = false);
  Task<ApiResponse<PagedResult<ClassDto>>> GetAdminClassesAsync(ClassQueryParameters parameters);
}
