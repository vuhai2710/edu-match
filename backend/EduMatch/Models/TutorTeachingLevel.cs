using EduMatch.Common.Enums;

namespace EduMatch.Models
{
  public class TutorTeachingLevel : BaseEntity
  {
    public long TutorId { get; set; }
    public EducationLevel TeachingLevel { get; set; }

    public Tutor Tutor { get; set; } = null!;
  }
}
