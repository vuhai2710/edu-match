using EduMatch.Enums;

namespace EduMatch.Models
{
  public class TutorRequest : BaseEntity
  {
    public long StudentId { get; set; }
    public long SubjectId { get; set; }
    public decimal BudgetMax { get; set; }
    public string? Note { get; set; }
    public TutorRequestStatus Status { get; set; } = TutorRequestStatus.Open;
    public DateTime? ExpiresAt { get; set; }
    public string? PreferredSchedule { get; set; }
    public int? SessionsPerWeek { get; set; }
    public int? MinutesPerSession { get; set; }

    public long? AddressId { get; set; }
    public Address? Address { get; set; }

    public User Student { get; set; } = null!;
    public Subject Subject { get; set; } = null!;
    public ICollection<Application> Applications { get; set; } = [];
  }
}
