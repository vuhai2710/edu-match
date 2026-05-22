using EduMatch.Common.Enums;

namespace EduMatch.DTOs.CancellationRequests
{
  public class CancellationRequestDto
  {
    public long Id { get; set; }
    public long ClassId { get; set; }
    public string ClassCode { get; set; } = string.Empty;
    public ClassStatus ClassStatus { get; set; }
    public long StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public long TutorProfileId { get; set; }
    public long TutorUserId { get; set; }
    public string TutorName { get; set; } = string.Empty;
    public long RequestedByUserId { get; set; }
    public string RequestedByUserName { get; set; } = string.Empty;
    public UserRole RequestedByRole { get; set; }
    public string Reason { get; set; } = string.Empty;
    public CancellationRequestStatus Status { get; set; }
    public decimal? RefundAmount { get; set; }
    public string? RefundNote { get; set; }
    public bool IsRefunded { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public long? ResolvedByUserId { get; set; }
    public string? ResolvedByUserName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
  }
}
