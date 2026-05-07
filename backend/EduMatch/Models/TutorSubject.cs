using EduMatch.Enums;

namespace EduMatch.Models
{
  public class TutorSubject : BaseEntity
  {
    public long TutorProfileId { get; set; }
    public long SubjectId { get; set; }
    public Level Level { get; set; }
    public Tutor Tutor { get; set; } = null!;
    public Subject Subject { get; set; } = null!;
  }
}
