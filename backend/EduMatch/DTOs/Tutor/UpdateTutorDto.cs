using EduMatch.DTOs.Address;
using EduMatch.Enums;

namespace EduMatch.DTOs.Tutor
{
  public class UpdateTutorSubjectDto
  {
    public long SubjectId { get; set; }
    public Level Level { get; set; }
  }

  public class UpdateTutorDto
  {
    public string Bio { get; set; } = string.Empty;
    public decimal HourlyRate { get; set; }
    public CreateAddressDto? Address { get; set; }
    public List<UpdateTutorSubjectDto> Subjects { get; set; } = [];
  }
}
