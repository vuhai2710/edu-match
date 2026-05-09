using EduMatch.Configuration;
using EduMatch.DTOs.Notification;
using EduMatch.Enums;
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

        public async Task<List<NotificationDto>> GetMyNotificationsAsync(long userId, int page, int pageSize)
        {
            var notifications = await _notificationRepository.GetUserNotificationsAsync(userId, page, pageSize);

            return notifications.Select(n => new NotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Content = n.Content,
                Type = n.Type,
                IsRead = n.IsRead,
                ReferenceType = n.ReferenceType,
                ReferenceId = n.ReferenceId,
                ActionUrl = n.ActionUrl,
                CreatedAt = n.CreatedAt
            }).ToList();
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
                throw new System.Exception("Notification not found");
            }

            if (!notification.IsRead)
            {
                notification.IsRead = true;
                await _notificationRepository.SaveChangesAsync();
            }
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

                var payload = new NotificationDto
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
    }
}