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

  public override async Task<DepositPolicy?> GetByIdAsync(long id)
  {
    return await _dbSet.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
  }

  public Task<DepositPolicy?> GetPolicyByIdAsync(long id) => GetByIdAsync(id);

  public async Task<DepositPolicy?> GetActivePolicyAsync()
  {
    var now = DateTime.UtcNow;

    return await _dbSet
      .Where(x => !x.IsDeleted)
      .Where(x =>
        (x.ActiveFrom == null || x.ActiveFrom <= now) &&
        (x.ActiveTo == null || x.ActiveTo >= now))
      .OrderByDescending(x => x.ActiveFrom ?? DateTime.MinValue)
      .ThenByDescending(x => x.UpdatedAt ?? x.CreatedAt)
      .FirstOrDefaultAsync();
  }

  public async Task<(IReadOnlyList<DepositPolicy> Items, int TotalCount)> GetPagedAsync(int page, int pageSize)
  {
    var query = _dbSet.Where(x => !x.IsDeleted);
    var total = await query.CountAsync();

    var items = await query
      .OrderByDescending(x => x.ActiveFrom ?? x.CreatedAt)
      .ThenByDescending(x => x.CreatedAt)
      .Skip((page - 1) * pageSize)
      .Take(pageSize)
      .ToListAsync();

    return (items, total);
  }

  public async Task<bool> HasOverlapAsync(DateTime? activeFrom, DateTime? activeTo, long? excludeId)
  {
    // Treat null bounds as open-ended: null ActiveFrom = -infinity, null ActiveTo = +infinity.
    // Two intervals [a, b] and [c, d] overlap iff a <= d && c <= b.
    var query = _dbSet.Where(x => !x.IsDeleted);
    if (excludeId.HasValue)
    {
      query = query.Where(x => x.Id != excludeId.Value);
    }

    return await query.AnyAsync(x =>
      (activeTo == null || x.ActiveFrom == null || x.ActiveFrom <= activeTo) &&
      (activeFrom == null || x.ActiveTo == null || activeFrom <= x.ActiveTo));
  }
}
