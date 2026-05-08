namespace EduMatch.DTOs.Applications
{
  public class ApplicationResponseDto
  {
    public long Id { get; set; }
    public long TutorProfileId { get; set; }
    public string TutorName { get; set; } = string.Empty;
    public string TutorAvatar { get; set; } = string.Empty;
    public double TutorRating { get; set; }
    public long TutorRequestId { get; set; }
    public string? Message { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
  }
}
