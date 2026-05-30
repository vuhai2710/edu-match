using EduMatch.Common.Enums;

namespace EduMatch.DTOs.User
{
  public class UserDto
  {
    public long Id { get; set; }
    public string? Code { get; set; }
    public string FullName { get; set; } = string.Empty;
    public int? Birth { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? School { get; set; }
    public UserRole Role { get; set; }
    public string? AvatarUrl { get; set; }
    public Gender Gender { get; set; }
    public bool IsActive { get; set; }
    public bool IsDeleted { get; set; }
    public bool IsGoogleAccount { get; set; }
    public TutorApprovalStatus? TutorApprovalStatus { get; set; }
    public long? TutorId { get; set; }
  }
}
