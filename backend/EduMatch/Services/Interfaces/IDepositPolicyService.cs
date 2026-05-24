using EduMatch.DTOs.DepositPolicy;

namespace EduMatch.Services.Interfaces;

public interface IDepositPolicyService
{
  Task<DepositPolicyDto> GetPolicyAsync();
  Task<DepositPolicyDto> UpsertPolicyAsync(UpsertDepositPolicyDto dto);
  Task<DepositPreviewResponseDto> PreviewDepositAsync(decimal hourlyRate, decimal hoursPerSession);
}
