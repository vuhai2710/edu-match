namespace EduMatch.DTOs.Dashboard
{
  public class AdminDashboardDto
  {
    public int TotalUsers { get; set; }
    public int TotalStudents { get; set; }
    public int TotalTutors { get; set; }
    public int PendingTutorApprovals { get; set; }

    public int TotalRequests { get; set; }
    public int OpenRequests { get; set; }
    public int PendingApplications { get; set; }

    public int ActiveClasses { get; set; }
    public int CompletedClasses { get; set; }

    public decimal TotalRevenue { get; set; }
    public decimal RevenueThisMonth { get; set; }

    public List<RecentApplicationItemDto> RecentApplications { get; set; } = [];
    public List<PendingTutorItemDto> PendingTutors { get; set; } = [];
  }

  public class RecentApplicationItemDto
  {
    public long Id { get; set; }
    public string TutorName { get; set; } = default!;
    public string SubjectName { get; set; } = default!;
    public string Status { get; set; } = default!;
    public DateTime AppliedAt { get; set; }
  }

  public class PendingTutorItemDto
  {
    public long TutorProfileId { get; set; }
    public string FullName { get; set; } = default!;
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }
    public decimal HourlyRate { get; set; }
    public DateTime RequestedAt { get; set; }
  }
}
