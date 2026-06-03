using EduMatch.Common.Enums;

namespace EduMatch.Models;

public class ClassCompletionRequest : BaseEntity
{
  public long ClassId { get; set; }
  public Class Class { get; set; } = null!;

  public long RequestedByUserId { get; set; }
  public User RequestedByUser { get; set; } = null!;

  public UserRole RequestedByRole { get; set; }

  public ClassCompletionRequestStatus Status { get; set; } = ClassCompletionRequestStatus.Pending;

  public DateTime? RespondedAt { get; set; }
  public long? RespondedByUserId { get; set; }
  public User? RespondedByUser { get; set; }
  public UserRole? RespondedByRole { get; set; }
}
