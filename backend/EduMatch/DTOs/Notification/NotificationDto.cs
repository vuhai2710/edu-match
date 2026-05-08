using EduMatch.Enums;

namespace EduMatch.DTOs.Notification
{
    public class NotificationDto
    {
        public long Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public NotificationType Type { get; set; }
        public bool IsRead { get; set; }
        public string? ReferenceType { get; set; }
        public long? ReferenceId { get; set; }
        public string? ActionUrl { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}