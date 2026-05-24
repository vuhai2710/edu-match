using EduMatch.Common.Enums;

namespace EduMatch.Models
{
  public class Student : BaseEntity
  {
    public string Code { get; set; } = null!;
    public long UserId { get; set; }
    public Grade? GradeLevel { get; set; }

    public long? AddressId { get; set; }
    public Address? Address { get; set; }

    public User User { get; set; } = null!;
  }
}

