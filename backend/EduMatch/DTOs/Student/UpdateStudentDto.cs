using EduMatch.DTOs.Address;
using EduMatch.Enums;
using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.StudentProfile
{
  public class UpdateStudentDto
  {
    public string FullName { get; set; } = string.Empty;
    public Gender Gender { get; set; }
    public string Bio { get; set; } = string.Empty;
    public string School { get; set; } = string.Empty;
    public string GradeLevel { get; set; } = string.Empty;
    
    [RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số")]
    public string? PhoneNumber { get; set; }
    
    public CreateAddressDto? Address { get; set; }
  }
}
