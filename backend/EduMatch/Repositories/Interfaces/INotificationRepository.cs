using EduMatch.Models;

namespace EduMatch.Repositories.Interfaces
{
    public interface INotificationRepository
    {
        Task AddAsync(Notification notification);

        Task<List<Notification>> GetUserNotificationsAsync(
            long userId,
            int page,
            int pageSize);

        Task<int> CountUnreadAsync(long userId);

        Task<Notification?> GetByIdAsync(long id);

        Task SaveChangesAsync();
    }
}