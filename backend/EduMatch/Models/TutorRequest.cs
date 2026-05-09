using EduMatch.Enums;

namespace EduMatch.Models
{
  public class TutorRequest : BaseEntity
  {
    public string Code { get; set; } = null!;
    public long StudentId { get; set; }
    public long SubjectId { get; set; }
    public decimal PricePerSession { get; set; }
    public string? Note { get; set; }
    public TutorRequestStatus Status { get; set; } = TutorRequestStatus.Open;
    public DateTime? ExpiresAt { get; set; }
    public string? PreferredSchedule { get; set; }
    public int SessionsPerWeek { get; set; }
    public int MinutesPerSession { get; set; }
    public Grade? GradeLevel { get; set; }
    public EducationLevel? EducationLevel { get; set; }
    public long? AddressId { get; set; }
    public Address? Address { get; set; }

    public User Student { get; set; } = null!;
    public Subject Subject { get; set; } = null!;
    public ICollection<Application> Applications { get; set; } = [];
  }
}
