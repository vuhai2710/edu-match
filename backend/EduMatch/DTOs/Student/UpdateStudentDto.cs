using EduMatch.Enums;

namespace EduMatch.DTOs.StudentProfile
{
  public class UpdateStudentDto
  {
    public string FullName { get; set; } = string.Empty;
    public Gender Gender { get; set; }
    public string? AvatarUrl { get; set; }
    public string Bio { get; set; } = string.Empty;
    public string School { get; set; } = string.Empty;
    public string GradeLevel { get; set; } = string.Empty;
  }
}
