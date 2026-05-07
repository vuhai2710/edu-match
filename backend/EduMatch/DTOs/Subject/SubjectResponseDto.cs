namespace EduMatch.DTOs.Subject
{
  public class SubjectResponseDto
  {
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
  }
}
