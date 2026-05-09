using EduMatch.Enums;

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

    public long? AddressId { get; set; }
    public Address? Address { get; set; }
    public File? CvFile { get; set; }

    public User User { get; set; } = null!;
    public ICollection<TutorSubject> TutorSubjects { get; set; } = [];
    public ICollection<Application> Applications { get; set; } = [];
  }
}
