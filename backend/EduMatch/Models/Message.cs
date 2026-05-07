namespace EduMatch.Models
{
  public class Message : BaseEntity
  {
    public long SenderId { get; set; }
    public long ReceiverId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public User Sender { get; set; } = null!;
    public User Receiver { get; set; } = null!;
  }
}
