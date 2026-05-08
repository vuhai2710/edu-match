using EduMatch.Enums;

namespace EduMatch.Models
{
  public class User : BaseEntity
  {
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Password { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public long? AvatarFileId { get; set; }
    public Gender Gender { get; set; }
    public bool IsActive { get; set; } = true;
    public File? AvatarFile { get; set; }
    public Tutor? TutorProfile { get; set; }
    public Student? StudentProfile { get; set; }
    public ICollection<Message> SentMessages { get; set; } = [];
    public ICollection<Message> ReceivedMessages { get; set; } = [];
    public ICollection<Notification> Notifications { get; set; } = [];
    public bool IsGoogleAccount { get; set; } = false;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }
  }
}
