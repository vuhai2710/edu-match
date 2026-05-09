namespace EduMatch.DTOs.Dashboard
{
  public class StudentDashboardDto
  {
    public int TotalRequests { get; set; }
    public int OpenRequests { get; set; }
    public int ClosedRequests { get; set; }

    public int TotalApplicationsReceived { get; set; }
    public int PendingApplicationsReceived { get; set; }

    public int ActiveClasses { get; set; }
    public int CompletedClasses { get; set; }

    public List<RecentRequestItemDto> RecentRequests { get; set; } = [];
  }

  public class RecentRequestItemDto
  {
    public long RequestId { get; set; }
    public string SubjectName { get; set; } = default!;
    public string Status { get; set; } = default!;
    public int ApplicationCount { get; set; }
    public DateTime CreatedAt { get; set; }
  }
}
