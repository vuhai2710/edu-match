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

  public async Task<DepositPolicy?> GetDefaultPolicyAsync(long? excludeId = null)
  {
    var query = _dbSet
      .Where(x => !x.IsDeleted)
      .Where(x => x.ActiveFrom == null && x.ActiveTo == null);

    if (excludeId.HasValue)
    {
      query = query.Where(x => x.Id != excludeId.Value);
    }

    return await query
      .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
      .FirstOrDefaultAsync();
  }

  public async Task<DepositPolicy?> GetActivePolicyAsync()
  {
    var today = DateTime.UtcNow.Date;

    return await _dbSet
      .Where(x => !x.IsDeleted)
      .Where(x =>
        // Exclude policies that haven't started yet
        (x.ActiveFrom == null || x.ActiveFrom.Value.Date <= today) &&
        // Exclude expired policies - strictly: ActiveTo must cover today (inclusive)
        (x.ActiveTo == null || x.ActiveTo.Value.Date >= today))
      // Prioritize time-based policies over default (false=0 sorts before true=1)
      .OrderBy(x => x.ActiveFrom == null && x.ActiveTo == null)
      // Among time-based policies, prefer the one with the latest start date
      .ThenByDescending(x => x.ActiveFrom)
      // Tiebreak by most recently updated
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
    var isDefaultPolicy = activeFrom == null && activeTo == null;
    var today = DateTime.UtcNow.Date;
    var fromDate = activeFrom?.Date;
    var toDate = activeTo?.Date;

    var query = _dbSet.Where(x => !x.IsDeleted);
    if (excludeId.HasValue)
    {
      query = query.Where(x => x.Id != excludeId.Value);
    }

    if (isDefaultPolicy)
    {
      return await query.AnyAsync(x => x.ActiveFrom == null && x.ActiveTo == null);
    }

    query = query
      .Where(x => x.ActiveFrom != null || x.ActiveTo != null)
      .Where(x => x.ActiveTo == null || x.ActiveTo.Value.Date >= today);

    return await query.AnyAsync(x =>
      (toDate == null || x.ActiveFrom == null || x.ActiveFrom.Value.Date <= toDate) &&
      (fromDate == null || x.ActiveTo == null || fromDate <= x.ActiveTo.Value.Date));
  }
}
