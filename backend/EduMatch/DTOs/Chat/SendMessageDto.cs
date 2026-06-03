using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Chat
{
  public class SendMessageDto
  {
    [Required(ErrorMessage = "Người nhận không được để trống.")]
    public long ReceiverId { get; set; }

    [Required(ErrorMessage = "Nội dung tin nhắn không được để trống.")]
    [MaxLength(2000, ErrorMessage = "Nội dung tin nhắn không được vượt quá 2000 ký tự.")]
    public string Content { get; set; } = null!;
  }
}
