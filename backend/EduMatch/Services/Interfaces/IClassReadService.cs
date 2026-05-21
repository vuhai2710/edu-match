using EduMatch.DTOs;
using EduMatch.DTOs.Classes;

namespace EduMatch.Services.Interfaces;

public interface IClassReadService
{
  Task<PagedResult<ClassDto>> GetStudentClassesAsync(long currentUserId, ClassQueryParameters parameters);
  Task<PagedResult<ClassDto>> GetTutorClassesAsync(long tutorProfileId, ClassQueryParameters parameters);
  Task<ClassDto> GetByIdAsync(long id, long currentUserId, bool isAdmin = false);
  Task<PagedResult<ClassDto>> GetAdminClassesAsync(ClassQueryParameters parameters);
}
