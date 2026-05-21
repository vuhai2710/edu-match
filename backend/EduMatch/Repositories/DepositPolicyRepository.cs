using EduMatch.Data;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Repositories;

public class DepositPolicyRepository : Repository<DepositPolicy>, IDepositPolicyRepository
{
  public DepositPolicyRepository(AppDbContext context) : base(context)
  {
  }

  public async Task<DepositPolicy?> GetSingletonAsync()
  {
    return await _dbSet
      .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
      .FirstOrDefaultAsync();
  }

  public async Task<DepositPolicy?> GetActivePolicyAsync()
  {
    var now = DateTime.UtcNow;

    return await _dbSet
      .Where(x =>
        (x.ActiveFrom == null || x.ActiveFrom <= now) &&
        (x.ActiveTo == null || x.ActiveTo >= now))
      .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
      .FirstOrDefaultAsync();
  }
}
