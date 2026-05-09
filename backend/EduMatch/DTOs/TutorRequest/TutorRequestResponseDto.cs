namespace EduMatch.DTOs.TutorRequests
{
  public class TutorRequestResponseDto
  {
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public long StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentAvatar { get; set; } = string.Empty;
    public long SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public string? Note { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsExpired { get; set; }
    public decimal PricePerSession { get; set; }
    public string? FullAddress { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? PreferredSchedule { get; set; }
    public int SessionsPerWeek { get; set; }
    public int MinutesPerSession { get; set; }
    public int SessionsPerMonth { get; set; }
    public string? GradeLevel { get; set; }
    public string? EducationLevel { get; set; }
    public int ApplicationCount { get; set; }
    public DateTime CreatedAt { get; set; }
  }
}
