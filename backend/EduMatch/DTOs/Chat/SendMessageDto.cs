using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Chat
{
  public class SendMessageDto
  {
    [Required]
    public long ReceiverId { get; set; }

    [Required]
    [MaxLength(2000)]
    public string Content { get; set; } = null!;
  }
}
