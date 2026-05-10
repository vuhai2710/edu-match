using EduMatch.Common.Enums;
using EduMatch.DTOs.Address;
using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Tutor
{
  public class UpdateTutorSubjectDto
  {
    public long SubjectId { get; set; }
    public Level Level { get; set; }
  }

  public class UpdateTutorDto
  {
    public string FullName { get; set; } = string.Empty;
    public Gender Gender { get; set; }
    public string Bio { get; set; } = string.Empty;
    public decimal HourlyRate { get; set; }
    
    [RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số")]
    public string? PhoneNumber { get; set; }
    
    public CreateAddressDto? Address { get; set; }
    public List<UpdateTutorSubjectDto> Subjects { get; set; } = [];
  }
}
