using EduMatch.Common.Enums;

namespace EduMatch.Models
{
  public class Tutor : BaseEntity
  {
    public string Code { get; set; } = null!;
    public long UserId { get; set; }
    public long? CvFileId { get; set; }
    public string Bio { get; set; } = string.Empty;
    public decimal HourlyRate { get; set; }
    public double Rating { get; set; } = 0;
    public long TotalReviews { get; set; } = 0;
    public TutorCareerStatus? CareerStatus { get; set; }
    public string Major { get; set; } = string.Empty;
    public AcademicDegree? AcademicDegree { get; set; }

    public long? AddressId { get; set; }
    public Address? Address { get; set; }
    public File? CvFile { get; set; }

    public User User { get; set; } = null!;
    public ICollection<TutorSubject> TutorSubjects { get; set; } = [];
    public ICollection<TutorTeachingLevel> TeachingLevels { get; set; } = [];
    public ICollection<Application> Applications { get; set; } = [];
  }
}
