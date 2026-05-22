using EduMatch.Common.Enums;
using EduMatch.Data;
using EduMatch.DTOs;
using EduMatch.DTOs.CancellationRequests;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Repositories
{
  public class CancellationRequestRepository : Repository<CancellationRequest>, ICancellationRequestRepository
  {
    public CancellationRequestRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<bool> HasPendingRequestForClassAsync(long classId)
    {
      return await _dbSet.AnyAsync(x =>
        x.ClassId == classId &&
        x.Status == CancellationRequestStatus.Pending);
    }

    public async Task<CancellationRequest?> GetByIdWithDetailsAsync(long id)
    {
      return await BuildDetailsQuery()
        .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<PagedResult<CancellationRequest>> GetPagedWithDetailsAsync(CancellationRequestQueryParameters parameters)
    {
      var query = BuildDetailsQuery();

      if (parameters.Status.HasValue)
      {
        query = query.Where(x => x.Status == parameters.Status.Value);
      }

      if (!string.IsNullOrWhiteSpace(parameters.SearchTerm))
      {
        var searchTerm = parameters.SearchTerm.Trim().ToLower();
        query = query.Where(x =>
          x.Class.Code.ToLower().Contains(searchTerm) ||
          x.RequestedByUser.FullName.ToLower().Contains(searchTerm) ||
          x.Class.Student.FullName.ToLower().Contains(searchTerm) ||
          x.Class.Tutor.User.FullName.ToLower().Contains(searchTerm));
      }

      query = ApplySorting(query, parameters);

      var totalCount = await query.CountAsync();
      var items = await query
        .Skip((parameters.Page - 1) * parameters.PageSize)
        .Take(parameters.PageSize)
        .ToListAsync();

      return new PagedResult<CancellationRequest>
      {
        Items = items,
        TotalCount = totalCount,
        Page = parameters.Page,
        PageSize = parameters.PageSize,
        TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)parameters.PageSize)
      };
    }

    private IQueryable<CancellationRequest> BuildDetailsQuery()
    {
      return _dbSet
        .Include(x => x.Class)
          .ThenInclude(x => x.Student)
        .Include(x => x.Class)
          .ThenInclude(x => x.Tutor)
            .ThenInclude(x => x.User)
        .Include(x => x.RequestedByUser)
        .Include(x => x.ResolvedByUser)
        .AsQueryable();
    }

    private static IQueryable<CancellationRequest> ApplySorting(
      IQueryable<CancellationRequest> query,
      CancellationRequestQueryParameters parameters)
    {
      var isDescending = string.Equals(parameters.SortDirection, "desc", StringComparison.OrdinalIgnoreCase);
      var sortColumn = parameters.SortColumn?.Trim().ToLower();

      return sortColumn switch
      {
        "resolvedat" => isDescending
          ? query.OrderByDescending(x => x.ResolvedAt).ThenByDescending(x => x.CreatedAt)
          : query.OrderBy(x => x.ResolvedAt).ThenBy(x => x.CreatedAt),
        "status" => isDescending
          ? query.OrderByDescending(x => x.Status).ThenByDescending(x => x.CreatedAt)
          : query.OrderBy(x => x.Status).ThenBy(x => x.CreatedAt),
        _ => query.OrderByDescending(x => x.CreatedAt)
      };
    }
  }
}
