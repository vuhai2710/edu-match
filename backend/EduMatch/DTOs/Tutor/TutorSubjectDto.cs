using EduMatch.Common.Enums;

namespace EduMatch.DTOs.Tutor
{
  public class TutorSubjectDto
  {
    public long SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public Level Level { get; set; }
  }
}
