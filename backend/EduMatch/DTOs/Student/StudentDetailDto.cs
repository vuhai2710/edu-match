using EduMatch.DTOs.Address;
using EduMatch.Enums;

namespace EduMatch.DTOs.StudentProfile
{
  public class StudentDetailDto
  {
    public string Code { get; set; } = string.Empty;
    public long UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public Gender Gender { get; set; }
    public string Bio { get; set; } = string.Empty;
    public string School { get; set; } = string.Empty;
    public string GradeLevel { get; set; } = string.Empty;
    public AddressDto? Address { get; set; }
  }
}
