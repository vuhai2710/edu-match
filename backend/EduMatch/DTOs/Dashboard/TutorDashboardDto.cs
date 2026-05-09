namespace EduMatch.DTOs.Dashboard
{
  public class TutorDashboardDto
  {
    public int TotalApplications { get; set; }
    public int PendingApplications { get; set; }
    public int AcceptedApplications { get; set; }
    public int RejectedApplications { get; set; }

    public int ActiveClasses { get; set; }
    public int CompletedClasses { get; set; }

    public double AverageRating { get; set; }
    public long TotalReviews { get; set; }

    public decimal TotalDeposits { get; set; }

    public List<MyApplicationItemDto> RecentApplications { get; set; } = [];
  }

  public class MyApplicationItemDto
  {
    public long ApplicationId { get; set; }
    public string SubjectName { get; set; } = default!;
    public string Status { get; set; } = default!;
    public DateTime AppliedAt { get; set; }
  }
}
