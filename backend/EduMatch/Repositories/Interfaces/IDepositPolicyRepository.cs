using EduMatch.Models;

namespace EduMatch.Repositories.Interfaces;

public interface IDepositPolicyRepository : IRepository<DepositPolicy>
{
  Task<DepositPolicy?> GetActivePolicyAsync();
  Task<(IReadOnlyList<DepositPolicy> Items, int TotalCount)> GetPagedAsync(int page, int pageSize);
  Task<DepositPolicy?> GetPolicyByIdAsync(long id);
  Task<bool> HasOverlapAsync(DateTime? activeFrom, DateTime? activeTo, long? excludeId);
}
