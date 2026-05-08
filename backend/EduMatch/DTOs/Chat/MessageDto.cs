using System;

namespace EduMatch.DTOs.Chat
{
  public class MessageDto
  {
    public long Id { get; set; }
    public long SenderId { get; set; }
    public string SenderName { get; set; } = null!;
    public string? SenderAvatar { get; set; }
    public long ReceiverId { get; set; }
    public string ReceiverName { get; set; } = null!;
    public string Content { get; set; } = null!;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
  }
}
