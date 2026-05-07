namespace EduMatch.Models
{
  public class Student : BaseEntity
  {
    public long UserId { get; set; }
    public string Bio { get; set; } = string.Empty;
    public string School { get; set; } = string.Empty;
    public string GradeLevel { get; set; } = string.Empty;
    public User User { get; set; } = null!;
  }
}
