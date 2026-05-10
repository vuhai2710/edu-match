using EduMatch.Common.Enums;
using EduMatch.DTOs;
using EduMatch.DTOs.Notification;

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

    Task<PagedResult<NotificationDto>> GetMyNotificationsAsync(
      long userId,
      NotificationQueryParameters parameters);

    Task<int> GetUnreadCountAsync(long userId);

    Task MarkAsReadAsync(long notificationId, long userId);

    Task<bool> MarkAllAsReadAsync(long userId);

    Task SendToMultipleAsync(
      IEnumerable<long> userIds,
      string title,
      string content,
      NotificationType type,
      string? referenceType = null,
      long? referenceId = null,
      string? actionUrl = null);
  }
}
