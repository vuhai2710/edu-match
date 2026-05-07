using EduMatch.Enums;

namespace EduMatch.Models
{
  public class Tutor : BaseEntity
  {
    public long UserId { get; set; }
    public string Bio { get; set; } = string.Empty;
    public decimal HourlyRate { get; set; }
    public double Rating { get; set; } = 0;
    public long TotalReviews { get; set; } = 0;
    public ApprovalStatus ApprovalStatus { get; set; } = ApprovalStatus.Pending;

    public long? AddressId { get; set; }
    public Address? Address { get; set; }

    public User User { get; set; } = null!;
    public ICollection<TutorSubject> TutorSubjects { get; set; } = [];
    public ICollection<Application> Applications { get; set; } = [];
  }
}
