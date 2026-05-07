namespace EduMatch.Models
{
  public class Subject : BaseEntity
  {
    public string Name { get; set; } = string.Empty;      
    public string? Description { get; set; }
    public ICollection<TutorSubject> TutorSubjects { get; set; } = [];
  }
}
