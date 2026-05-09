using EduMatch.DTOs.Dashboard;

namespace EduMatch.Services.Interfaces
{
  public interface IDashboardService
  {
    Task<AdminDashboardDto> GetAdminDashboardAsync();
    Task<TutorDashboardDto> GetTutorDashboardAsync(long tutorProfileId);
    Task<StudentDashboardDto> GetStudentDashboardAsync(long studentUserId);
  }
}
