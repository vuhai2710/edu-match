using EduMatch.DTOs;
using EduMatch.DTOs.DepositPolicy;

namespace EduMatch.Services.Interfaces;

public interface IDepositPolicyService
{
  Task<DepositPolicyDto> GetCurrentActivePolicyAsync();
  Task<PagedResult<DepositPolicyDto>> GetHistoryAsync(int page, int pageSize);
  Task<DepositPolicyDto> GetPolicyByIdAsync(long id);
  Task<DepositPolicyDto> CreatePolicyAsync(UpsertDepositPolicyDto dto);
  Task<DepositPolicyDto> UpdatePolicyAsync(long id, UpsertDepositPolicyDto dto);
  Task DeletePolicyAsync(long id);
  Task<DepositPreviewResponseDto> PreviewDepositAsync(decimal hourlyRate, decimal hoursPerSession);
}
