using EduMatch.DTOs;
using EduMatch.DTOs.Applications;

namespace EduMatch.Services.Interfaces
{
  public interface IApplicationService
  {
    Task<ApiResponse<ApplicationResponseDto>> ApplyAsync(long tutorUserId, long requestId, ApplyToRequestDto dto);
    Task<ApiResponse<ApplicationResponseDto>> GetByIdAsync(long applicationId, long currentUserId, bool isAdmin);
    Task<ApiResponse<bool>> StudentConfirmAsync(long applicationId, long studentId);
    Task<ApiResponse<bool>> StudentRejectAsync(long applicationId, long studentId);
    Task<ApiResponse<bool>> StudentAcceptMatchAsync(long applicationId, long studentId);
    Task<ApiResponse<bool>> TutorAcceptMatchAsync(long applicationId, long tutorUserId);
    Task<ApiResponse<bool>> AdminApproveAsync(long applicationId, decimal depositAmount);
    Task<ApiResponse<bool>> AdminRejectAsync(long applicationId);
    Task<ApiResponse<ApplicationResponseDto>> AdminMatchAsync(long requestId, long tutorProfileId, decimal depositAmount);
    Task<ApiResponse<PagedResult<ApplicationResponseDto>>> GetByRequestIdAsync(long requestId, long studentId, int page, int pageSize);
    Task<ApiResponse<PagedResult<ApplicationResponseDto>>> GetMyApplicationsAsync(long tutorUserId, int page, int pageSize);
    Task<ApiResponse<PagedResult<ApplicationResponseDto>>> GetAllForAdminAsync(ApplicationQueryParameters parameters);
  }
}
