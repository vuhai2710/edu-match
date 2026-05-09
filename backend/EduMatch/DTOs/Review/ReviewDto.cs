namespace EduMatch.DTOs.Review
{
  public class ReviewDto
  {
    public long Id { get; set; }
    public long ClassId { get; set; }
    public string ClassCode { get; set; } = string.Empty;
    public long StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public long TutorId { get; set; }
    public string TutorName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
  }
}
