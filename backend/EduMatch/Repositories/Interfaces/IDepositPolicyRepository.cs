using EduMatch.Models;

namespace EduMatch.Repositories.Interfaces;

public interface IDepositPolicyRepository : IRepository<DepositPolicy>
{
  Task<DepositPolicy?> GetSingletonAsync();
  Task<DepositPolicy?> GetActivePolicyAsync();
}
