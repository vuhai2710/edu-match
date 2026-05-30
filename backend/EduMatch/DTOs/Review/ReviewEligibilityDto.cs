namespace EduMatch.DTOs.Review
{
  public class ReviewEligibilityDto
  {
    public long ClassId { get; set; }
    public bool CanReview { get; set; }
    public string ReasonCode { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime? AvailableAt { get; set; }
    public bool AlreadyReviewed { get; set; }
  }
}
