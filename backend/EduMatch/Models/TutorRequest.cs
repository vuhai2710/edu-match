using EduMatch.Enums;
using EduMatch.Models;

public class TutorRequest : BaseEntity
{
  public long StudentId { get; set; }
  public long SubjectId { get; set; }
  public string? Area { get; set; }
  public decimal BudgetMax { get; set; }
  public string? Note { get; set; }
  public RequestStatus Status { get; set; } = RequestStatus.Pending;

  public User Student { get; set; } = null!;
  public Subject Subject { get; set; } = null!;
  public ICollection<Application> Applications { get; set; } = [];
}