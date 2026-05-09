using EduMatch.DTOs;
using EduMatch.DTOs.Dashboard;

namespace EduMatch.Services.Interfaces
{
  public interface ITutorApprovalService
  {
    Task<PagedResult<PendingTutorItemDto>> GetPendingTutorsAsync(int page, int pageSize);
    Task ApproveAsync(long tutorProfileId);
    Task RejectAsync(long tutorProfileId);
  }
}
