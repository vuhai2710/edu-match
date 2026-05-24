namespace EduMatch.DTOs.Subject
{
  public class SubjectListItemDto
  {
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int TutorCount { get; set; }
  }
}
