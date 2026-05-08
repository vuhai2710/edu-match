using System;

namespace EduMatch.DTOs.Chat
{
  public class ConversationSummaryDto
  {
    public long PartnerId { get; set; }
    public string PartnerName { get; set; } = null!;
    public string? PartnerAvatar { get; set; }
    public string PartnerRole { get; set; } = null!;
    public string LastMessage { get; set; } = null!;
    public DateTime LastMessageAt { get; set; }
    public int UnreadCount { get; set; }
  }
}
