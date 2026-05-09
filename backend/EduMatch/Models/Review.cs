namespace EduMatch.Models
{
  public class Review : BaseEntity
  {
    public long ClassId { get; set; }
    public Class Class { get; set; } = null!;

    public long StudentId { get; set; }
    public User Student { get; set; } = null!;

    public long TutorId { get; set; }
    public Tutor Tutor { get; set; } = null!;

    public int Rating { get; set; }
    public string? Comment { get; set; }
  }
}
