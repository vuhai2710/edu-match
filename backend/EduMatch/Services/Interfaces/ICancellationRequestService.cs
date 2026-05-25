using EduMatch.Common.Enums;
using EduMatch.DTOs;
using EduMatch.DTOs.CancellationRequests;

namespace EduMatch.Services.Interfaces
{
  public interface ICancellationRequestService
  {
    Task<ApiResponse<CancellationRequestDto>> CreateAsync(long currentUserId, UserRole role, CreateCancellationRequestDto dto);
    Task<ApiResponse<CancellationRequestDto>> ResolveAsync(long requestId, long adminUserId, ResolveCancellationRequestDto dto);
    Task<ApiResponse<PagedResult<CancellationRequestDto>>> GetAllForAdminAsync(CancellationRequestQueryParameters parameters);
    Task<ApiResponse<PagedResult<CancellationRequestDto>>> GetMineAsync(long currentUserId, UserRole role, CancellationRequestQueryParameters parameters);
    Task<ApiResponse<CancellationRequestDto>> GetByIdAsync(long id);
    Task<ApiResponse<CancellationRequestDto>> GetLatestByClassIdAsync(long classId, long currentUserId, UserRole role);
  }
}
