using EduMatch.Data;
using EduMatch.DTOs;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Repositories
{
  public class NotificationRepository : INotificationRepository
  {
    private readonly AppDbContext _context;

    public NotificationRepository(AppDbContext context)
    {
      _context = context;
    }

    public async Task AddAsync(Notification notification)
    {
      await _context.Notifications.AddAsync(notification);
    }

    public async Task<int> CountUnreadAsync(long userId)
    {
      return await _context.Notifications
        .Where(n => n.UserId == userId && !n.IsRead && !n.IsDeleted)
        .CountAsync();
    }

    public async Task<Notification?> GetByIdAsync(long id)
    {
      return await _context.Notifications
        .FirstOrDefaultAsync(n => n.Id == id && !n.IsDeleted);
    }

    public async Task<PagedResult<Notification>> GetUserNotificationsAsync(long userId, int page, int pageSize, bool? isRead)
    {
      var query = _context.Notifications
        .Where(n => n.UserId == userId && !n.IsDeleted);

      if (isRead.HasValue)
      {
        query = query.Where(n => n.IsRead == isRead.Value);
      }

      var totalCount = await query.CountAsync();
      var items = await query
        .OrderByDescending(n => n.CreatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

      return new PagedResult<Notification>
      {
        Items = items,
        TotalCount = totalCount,
        Page = page,
        PageSize = pageSize,
        TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize)
      };
    }

    public async Task<int> MarkAllAsReadAsync(long userId)
    {
      return await _context.Notifications
        .Where(n => n.UserId == userId && !n.IsRead && !n.IsDeleted)
        .ExecuteUpdateAsync(setters => setters.SetProperty(n => n.IsRead, true));
    }

    public async Task SaveChangesAsync()
    {
      await _context.SaveChangesAsync();
    }
  }
}
