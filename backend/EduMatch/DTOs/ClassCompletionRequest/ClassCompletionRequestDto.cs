using EduMatch.Common.Enums;

namespace EduMatch.DTOs.ClassCompletionRequests;

public class ClassCompletionRequestDto
{
  public long Id { get; set; }
  public long ClassId { get; set; }
  public string ClassCode { get; set; } = string.Empty;
  public ClassStatus ClassStatus { get; set; }
  public long StudentId { get; set; }
  public string StudentName { get; set; } = string.Empty;
  public long TutorId { get; set; }
  public long TutorUserId { get; set; }
  public string TutorName { get; set; } = string.Empty;
  public long RequestedByUserId { get; set; }
  public string RequestedByUserName { get; set; } = string.Empty;
  public UserRole RequestedByRole { get; set; }
  public ClassCompletionRequestStatus Status { get; set; }
  public DateTime? RespondedAt { get; set; }
  public long? RespondedByUserId { get; set; }
  public string? RespondedByUserName { get; set; }
  public UserRole? RespondedByRole { get; set; }
  public DateTime CreatedAt { get; set; }
  public DateTime? UpdatedAt { get; set; }
}
