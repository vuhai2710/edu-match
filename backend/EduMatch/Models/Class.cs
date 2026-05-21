using EduMatch.Common.Enums;

namespace EduMatch.Models
{
  public class Class : BaseEntity
  {
    public string Code { get; set; } = null!;

    public long StudentId { get; set; }
    public User Student { get; set; } = null!;

    public long TutorId { get; set; }
    public Tutor Tutor { get; set; } = null!;

    public long? RequestId { get; set; }
    public TutorRequest? Request { get; set; }

    public long? ApplicationId { get; set; }
    public Application? Application { get; set; }

    public long? LearningRequestId { get; set; }
    public LearningRequest? LearningRequest { get; set; }

    public long? SubjectId { get; set; }
    public Subject? Subject { get; set; }

    public string? TimeSlotsJson { get; set; }
    public AcceptedScheduleSource? AcceptedScheduleSource { get; set; }

    public long? AcceptedScheduleProposalId { get; set; }
    public ScheduleProposal? AcceptedScheduleProposal { get; set; }

    public decimal? DepositAmountSnapshot { get; set; }

    public decimal DepositAmount { get; set; }

    public ClassStatus Status { get; set; } = ClassStatus.PendingStart;

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
  }
}