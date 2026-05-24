using EduMatch.DTOs;
using EduMatch.DTOs.CancellationRequests;
using EduMatch.Models;

namespace EduMatch.Repositories.Interfaces
{
  public interface ICancellationRequestRepository : IRepository<CancellationRequest>
  {
    Task<bool> HasPendingRequestForClassAsync(long classId);
    Task<CancellationRequest?> GetByIdWithDetailsAsync(long id);
    Task<PagedResult<CancellationRequest>> GetPagedWithDetailsAsync(CancellationRequestQueryParameters parameters);
  }
}
