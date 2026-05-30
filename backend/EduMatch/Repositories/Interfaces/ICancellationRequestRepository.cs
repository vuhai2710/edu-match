using EduMatch.DTOs;
using EduMatch.DTOs.CancellationRequests;
using EduMatch.Models;
using EduMatch.Common.Enums;

namespace EduMatch.Repositories.Interfaces
{
  public interface ICancellationRequestRepository : IRepository<CancellationRequest>
  {
    Task<bool> HasPendingRequestForClassAsync(long classId);
    Task<CancellationRequest?> GetByIdWithDetailsAsync(long id);
    Task<PagedResult<CancellationRequest>> GetPagedWithDetailsAsync(CancellationRequestQueryParameters parameters);
    Task<PagedResult<CancellationRequest>> GetPagedForUserWithDetailsAsync(long userId, UserRole role, CancellationRequestQueryParameters parameters);
    Task<CancellationRequest?> GetLatestByClassIdWithDetailsAsync(long classId);
  }
}
