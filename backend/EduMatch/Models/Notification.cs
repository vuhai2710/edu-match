namespace EduMatch.Models
{
  public class Notification : BaseEntity
  {
    public long UserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public string? ActionUrl { get; set; } 
    public User User { get; set; } = null!;
  }
}
