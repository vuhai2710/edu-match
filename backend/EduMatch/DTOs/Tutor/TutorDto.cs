namespace EduMatch.DTOs.Tutor
{
  public class TutorDto
  {
    public long Id { get; set; }
    public long UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public decimal HourlyRate { get; set; }
    public double Rating { get; set; }
    public long TotalReviews { get; set; }
    public List<TutorSubjectDto> Subjects { get; set; } = [];
  }
}
