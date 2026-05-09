namespace EduMatch.Models
{
  public class Student : BaseEntity
  {
    public string Code { get; set; } = null!;
    public long UserId { get; set; }
    public string Bio { get; set; } = string.Empty;
    public string School { get; set; } = string.Empty;
    public Enums.Grade? GradeLevel { get; set; }

    public long? AddressId { get; set; }
    public Address? Address { get; set; }

    public User User { get; set; } = null!;
  }
}

