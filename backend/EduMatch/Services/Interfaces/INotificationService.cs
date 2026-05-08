using EduMatch.DTOs.Notification;
using EduMatch.Enums;

namespace EduMatch.Services.Interfaces
{
    public interface INotificationService
    {
        Task SendAsync(
            long userId,
            string title,
            string content,
            NotificationType type,
            string? referenceType = null,
            long? referenceId = null,
            string? actionUrl = null);

        Task<List<NotificationDto>> GetMyNotificationsAsync(
            long userId,
            int page,
            int pageSize);

        Task<int> GetUnreadCountAsync(long userId);

        Task MarkAsReadAsync(long notificationId, long userId);
    }
}