namespace EduMatch.Models
{
  public class PasswordResetToken : BaseEntity
  {
    public long UserId { get; set; }
    public User User { get; set; } = null!;

    public string TokenHash { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public bool IsUsed { get; set; } = false;
    public DateTime? UsedAt { get; set; }
  }
}
