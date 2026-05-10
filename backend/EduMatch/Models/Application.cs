using EduMatch.Common.Enums;

namespace EduMatch.Models
{
  public class Application : BaseEntity
  {
    public long TutorId { get; set; }
    public long TutorRequestId { get; set; }
    public string? Message { get; set; }
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Pending;
    public bool StudentAcceptedMatch { get; set; }
    public bool TutorAcceptedMatch { get; set; }
    public decimal? DepositAmount { get; set; }

    public Tutor Tutor { get; set; } = null!;
    public TutorRequest TutorRequest { get; set; } = null!;
  }
}
