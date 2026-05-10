using EduMatch.Common.Enums;

namespace EduMatch.DTOs.User
{
  public class UserDto
  {
    public long Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string? AvatarUrl { get; set; }
    public Gender Gender { get; set; }
    public bool IsActive { get; set; }
  }
}
