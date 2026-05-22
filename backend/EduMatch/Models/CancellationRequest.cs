using EduMatch.Common.Enums;

namespace EduMatch.Models
{
  public class CancellationRequest : BaseEntity
  {
    public long ClassId { get; set; }
    public Class Class { get; set; } = null!;

    public long RequestedByUserId { get; set; }
    public User RequestedByUser { get; set; } = null!;

    public UserRole RequestedByRole { get; set; }
    public string Reason { get; set; } = string.Empty;

    public CancellationRequestStatus Status { get; set; } = CancellationRequestStatus.Pending;

    public decimal? RefundAmount { get; set; }
    public string? RefundNote { get; set; }
    public bool IsRefunded { get; set; }

    public DateTime? ResolvedAt { get; set; }
    public long? ResolvedByUserId { get; set; }
    public User? ResolvedByUser { get; set; }
  }
}
