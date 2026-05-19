using EduMatch.Common.Enums;
using EduMatch.DTOs.Address;

namespace EduMatch.DTOs.Tutor
{
  public class TutorDto
  {
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public long UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public Gender Gender { get; set; }
    public decimal HourlyRate { get; set; }
    public double Rating { get; set; }
    public long TotalReviews { get; set; }
    public TutorCareerStatus? CareerStatus { get; set; }
    public string Major { get; set; } = string.Empty;
    public AcademicDegree? AcademicDegree { get; set; }
    public AddressDto? Address { get; set; }
    public List<EducationLevel> TeachingLevels { get; set; } = [];
    public List<TutorSubjectDto> Subjects { get; set; } = [];
  }
}
