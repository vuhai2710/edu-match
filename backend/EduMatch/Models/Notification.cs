using EduMatch.Common.Enums;

namespace EduMatch.Models
{
  public class Notification : BaseEntity
  {
    public long UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public bool IsRead { get; set; } = false;
    public string? ReferenceType { get; set; }
    public long? ReferenceId { get; set; }
    public string? ActionUrl { get; set; } 
    public User User { get; set; } = null!;
  }
}
