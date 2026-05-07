using EduMatch.Enums;

namespace EduMatch.Models
{
  public class Application : BaseEntity
  {
    public long TutorProfileId { get; set; }
    public long TutorRequestId { get; set; }
    public string? Message { get; set; }
    public ApprovalStatus Status { get; set; } = ApprovalStatus.Pending;

    public Tutor Tutor { get; set; } = null!;
    public TutorRequest TutorRequest { get; set; } = null!;
  }
}
