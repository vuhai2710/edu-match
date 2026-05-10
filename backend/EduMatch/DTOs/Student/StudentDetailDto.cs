using EduMatch.Common.Enums;
using EduMatch.DTOs.Address;

namespace EduMatch.DTOs.StudentProfile
{
  public class StudentDetailDto
  {
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public long UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public Gender Gender { get; set; }
    public string Bio { get; set; } = string.Empty;
    public string School { get; set; } = string.Empty;
    public Grade? GradeLevel { get; set; }
    public AddressDto? Address { get; set; }
  }
}
