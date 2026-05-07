using EduMatch.Shared.Enums;

namespace EduMatch.DTOs.StudentProfile
{
  public class StudentDto
  {
    public long UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public Gender Gender { get; set; }
    public string GradeLevel { get; set; } = string.Empty;
    public string School { get; set; } = string.Empty;
  }
}
