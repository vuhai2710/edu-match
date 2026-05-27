using EduMatch.DTOs;
using EduMatch.DTOs.DepositPolicy;

namespace EduMatch.Services.Interfaces;

public interface IDepositPolicyService
{
  Task<ApiResponse<DepositPolicyDto?>> GetCurrentActivePolicyAsync();
  Task<ApiResponse<PagedResult<DepositPolicyDto>>> GetHistoryAsync(int page, int pageSize);
  Task<ApiResponse<DepositPolicyDto?>> GetPolicyByIdAsync(long id);
  Task<ApiResponse<DepositPolicyDto?>> CreatePolicyAsync(UpsertDepositPolicyDto dto);
  Task<ApiResponse<DepositPolicyDto?>> UpdatePolicyAsync(long id, UpsertDepositPolicyDto dto);
  Task<ApiResponse> DeletePolicyAsync(long id);
  Task<ApiResponse<DepositPreviewResponseDto>> PreviewDepositAsync(decimal hourlyRate, decimal hoursPerSession);
}
