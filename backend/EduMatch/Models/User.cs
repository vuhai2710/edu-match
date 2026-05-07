using EduMatch.Shared.Enums;

namespace EduMatch.Models
{
  public class User : BaseEntity
  {
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string? AvatarUrl { get; set; }
    public Gender Gender { get; set; }
    public UserStatus Status { get; set; } = UserStatus.Active;
    public bool IsActive { get; set; } = true;
    public Tutor? TutorProfile { get; set; }
    public Student? StudentProfile { get; set; }
    public ICollection<Message> SentMessages { get; set; } = [];
    public ICollection<Message> ReceivedMessages { get; set; } = [];
    public ICollection<Notification> Notifications { get; set; } = [];
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }
  }
}
