using EduMatch.DTOs;
using EduMatch.Models;

namespace EduMatch.Repositories.Interfaces
{
  public interface INotificationRepository
  {
    Task AddAsync(Notification notification);

    Task<PagedResult<Notification>> GetUserNotificationsAsync(
      long userId,
      int page,
      int pageSize,
      bool? isRead);

    Task<int> CountUnreadAsync(long userId);

    Task<Notification?> GetByIdAsync(long id);

    Task<int> MarkAllAsReadAsync(long userId);

    Task SaveChangesAsync();
  }
}
