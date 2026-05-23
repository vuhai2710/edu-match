using EduMatch.Common.Enums;
using EduMatch.DTOs.Address;
using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.StudentProfile
{
  public class UpdateStudentDto
  {
    public string FullName { get; set; } = string.Empty;
    public int? Birth { get; set; }
    public Gender Gender { get; set; }
    public string? School { get; set; }
    public Grade? GradeLevel { get; set; }
    
    [RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số")]
    public string? PhoneNumber { get; set; }
    
    public CreateAddressDto? Address { get; set; }
  }
}
