using EduMatch.Common.Enums;

namespace EduMatch.DTOs.Subject
{
  public class TutorCardDto
  {
    public long TutorId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public int? Birth { get; set; }
    public string? AvatarUrl { get; set; }
    public Gender Gender { get; set; }
    public double Rating { get; set; }
    public long TotalReviews { get; set; }
    public decimal HourlyRate { get; set; }
    public string? Profile { get; set; }
    public string Major { get; set; } = string.Empty;
    public string? School { get; set; }
    public List<string> Subjects { get; set; } = [];
    public List<EducationLevel> TeachingLevels { get; set; } = [];
  }
}
