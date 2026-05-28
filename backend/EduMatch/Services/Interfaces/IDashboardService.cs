using EduMatch.DTOs;
using EduMatch.DTOs.Dashboard;

namespace EduMatch.Services.Interfaces
{
  public interface IDashboardService
  {
    Task<ApiResponse<AdminDashboardDto>> GetAdminDashboardAsync();
    Task<ApiResponse<TutorDashboardDto>> GetTutorDashboardAsync(long tutorProfileId);
    Task<ApiResponse<StudentDashboardDto>> GetStudentDashboardAsync(long studentUserId);
  }
}
