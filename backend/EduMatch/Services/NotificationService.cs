using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.Configuration;
using EduMatch.DTOs;
using EduMatch.DTOs.Notification;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace EduMatch.Services
{
  public class NotificationService : INotificationService
  {
    private readonly INotificationRepository _notificationRepository;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
      INotificationRepository notificationRepository,
      IHubContext<NotificationHub> hubContext,
      ILogger<NotificationService> logger)
    {
      _notificationRepository = notificationRepository;
      _hubContext = hubContext;
      _logger = logger;
    }

    public async Task<PagedResult<NotificationDto>> GetMyNotificationsAsync(long userId, NotificationQueryParameters parameters)
    {
      var pagedNotifications = await _notificationRepository.GetUserNotificationsAsync(
        userId,
        parameters.Page,
        parameters.PageSize,
        parameters.IsRead);

      return new PagedResult<NotificationDto>
      {
        Items = pagedNotifications.Items.Select(MapNotification).ToList(),
        TotalCount = pagedNotifications.TotalCount,
        Page = pagedNotifications.Page,
        PageSize = pagedNotifications.PageSize,
        TotalPages = pagedNotifications.TotalPages
      };
    }

    public async Task<int> GetUnreadCountAsync(long userId)
    {
      return await _notificationRepository.CountUnreadAsync(userId);
    }

    public async Task MarkAsReadAsync(long notificationId, long userId)
    {
      var notification = await _notificationRepository.GetByIdAsync(notificationId);
      if (notification == null || notification.UserId != userId)
      {
        throw new NotFoundException("Không tìm thấy thông báo.", "NOTIFICATION_NOT_FOUND");
      }

      if (!notification.IsRead)
      {
        notification.IsRead = true;
        await _notificationRepository.SaveChangesAsync();
      }
    }

    public async Task<bool> MarkAllAsReadAsync(long userId)
    {
      await _notificationRepository.MarkAllAsReadAsync(userId);
      return true;
    }

    public async Task SendAsync(long userId, string title, string content, NotificationType type, string? referenceType = null, long? referenceId = null, string? actionUrl = null)
    {
      try
      {
        var notification = new Notification
        {
          UserId = userId,
          Title = title,
          Content = content,
          Type = type,
          ReferenceType = referenceType,
          ReferenceId = referenceId,
          ActionUrl = actionUrl,
          IsRead = false
        };

        await _notificationRepository.AddAsync(notification);
        await _notificationRepository.SaveChangesAsync();

        var payload = MapNotification(notification);

        await _hubContext.Clients
          .Group($"user:{userId}")
          .SendAsync("ReceiveNotification", payload);

        _logger.LogInformation("Notification sent to user {UserId}", userId);
      }
      catch (System.Exception ex)
      {
        _logger.LogError(ex, "Failed to send notification to user {UserId}", userId);
      }
    }

    public async Task SendToMultipleAsync(IEnumerable<long> userIds, string title, string content, NotificationType type, string? referenceType = null, long? referenceId = null, string? actionUrl = null)
    {
      foreach (var userId in userIds.Distinct())
      {
        await SendAsync(userId, title, content, type, referenceType, referenceId, actionUrl);
      }
    }

    private static NotificationDto MapNotification(Notification notification)
    {
      return new NotificationDto
      {
        Id = notification.Id,
        Title = notification.Title,
        Content = notification.Content,
        Type = notification.Type,
        IsRead = notification.IsRead,
        ReferenceType = notification.ReferenceType,
        ReferenceId = notification.ReferenceId,
        ActionUrl = notification.ActionUrl,
        CreatedAt = notification.CreatedAt
      };
    }
  }
}
