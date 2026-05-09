using EduMatch.Data;
using EduMatch.DTOs.Dashboard;
using EduMatch.Enums;
using EduMatch.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Services
{
  public class DashboardService : IDashboardService
  {
    private readonly AppDbContext _db;
    private readonly ILogger<DashboardService> _logger;

    public DashboardService(AppDbContext db, ILogger<DashboardService> logger)
    {
      _db = db;
      _logger = logger;
    }

    public async Task<AdminDashboardDto> GetAdminDashboardAsync()
    {
      var now = DateTime.UtcNow;
      var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

      var tTotalUsers    = _db.Users.CountAsync(u => !u.IsDeleted);
      var tStudents      = _db.Users.CountAsync(u => u.Role == UserRole.Student && !u.IsDeleted);
      var tTutors        = _db.Users.CountAsync(u => u.Role == UserRole.Tutor && !u.IsDeleted);
      var tPendingTutors = _db.TutorProfiles.CountAsync(t => t.ApprovalStatus == ApprovalStatus.Pending && !t.IsDeleted);
      var tTotalReqs     = _db.TutorRequests.CountAsync(r => !r.IsDeleted);
      var tOpenReqs      = _db.TutorRequests.CountAsync(r => r.Status == TutorRequestStatus.Open && !r.IsDeleted);
      var tPendingApps   = _db.Applications.CountAsync(a => a.Status == ApplicationStatus.Pending && !a.IsDeleted);
      var tActiveClass   = _db.Classes.CountAsync(c => c.Status == ClassStatus.Active && !c.IsDeleted);
      var tCompletedCls  = _db.Classes.CountAsync(c => c.Status == ClassStatus.Completed && !c.IsDeleted);
      var tRevTotal      = _db.Payments
                              .Where(p => p.Status == PaymentStatus.Success && !p.IsDeleted)
                              .SumAsync(p => (decimal?)p.Amount);
      var tRevMonth      = _db.Payments
                              .Where(p => p.Status == PaymentStatus.Success
                                       && p.PaidAt >= startOfMonth
                                       && !p.IsDeleted)
                              .SumAsync(p => (decimal?)p.Amount);

      await Task.WhenAll(
        tTotalUsers, tStudents, tTutors, tPendingTutors,
        tTotalReqs, tOpenReqs, tPendingApps,
        tActiveClass, tCompletedCls,
        tRevTotal, tRevMonth);

      var recentApps = await _db.Applications
        .Where(a => !a.IsDeleted)
        .OrderByDescending(a => a.CreatedAt)
        .Take(5)
        .Select(a => new RecentApplicationItemDto
        {
          Id          = a.Id,
          TutorName   = a.Tutor.User.FullName,
          SubjectName = a.TutorRequest.Subject.Name,
          Status      = a.Status.ToString(),
          AppliedAt   = a.CreatedAt
        })
        .ToListAsync();

      var pendingTutors = await _db.TutorProfiles
        .Where(t => t.ApprovalStatus == ApprovalStatus.Pending && !t.IsDeleted)
        .OrderBy(t => t.CreatedAt)
        .Take(5)
        .Select(t => new PendingTutorItemDto
        {
          TutorProfileId = t.Id,
          FullName       = t.User.FullName,
          AvatarUrl      = t.User.AvatarFile != null ? t.User.AvatarFile.FilePath : null,
          Bio            = t.Bio,
          HourlyRate     = t.HourlyRate,
          RequestedAt    = t.CreatedAt
        })
        .ToListAsync();

      _logger.LogInformation("AdminDashboard fetched successfully");

      return new AdminDashboardDto
      {
        TotalUsers            = await tTotalUsers,
        TotalStudents         = await tStudents,
        TotalTutors           = await tTutors,
        PendingTutorApprovals = await tPendingTutors,
        TotalRequests         = await tTotalReqs,
        OpenRequests          = await tOpenReqs,
        PendingApplications   = await tPendingApps,
        ActiveClasses         = await tActiveClass,
        CompletedClasses      = await tCompletedCls,
        TotalRevenue          = await tRevTotal ?? 0m,
        RevenueThisMonth      = await tRevMonth ?? 0m,
        RecentApplications    = recentApps,
        PendingTutors         = pendingTutors
      };
    }

    public async Task<TutorDashboardDto> GetTutorDashboardAsync(long tutorProfileId)
    {
      var appQuery = _db.Applications
        .Where(a => a.TutorId == tutorProfileId && !a.IsDeleted);

      var tTotal     = appQuery.CountAsync();
      var tPending   = appQuery.CountAsync(a => a.Status == ApplicationStatus.Pending);
      var tAccepted  = appQuery.CountAsync(a => a.Status == ApplicationStatus.BothAccepted);
      var tRejected  = appQuery.CountAsync(a => a.Status == ApplicationStatus.AdminRejected
                                             || a.Status == ApplicationStatus.StudentRejected);
      var tActive    = _db.Classes.CountAsync(c => c.TutorId == tutorProfileId
                                                && c.Status == ClassStatus.Active
                                                && !c.IsDeleted);
      var tCompleted = _db.Classes.CountAsync(c => c.TutorId == tutorProfileId
                                                && c.Status == ClassStatus.Completed
                                                && !c.IsDeleted);
      var tDeposits  = _db.Payments
                          .Where(p => p.TutorId == tutorProfileId
                                   && p.Status == PaymentStatus.Success
                                   && !p.IsDeleted)
                          .SumAsync(p => (decimal?)p.Amount);

      var profileTask = _db.TutorProfiles
        .AsNoTracking()
        .FirstOrDefaultAsync(t => t.Id == tutorProfileId && !t.IsDeleted);

      await Task.WhenAll(tTotal, tPending, tAccepted, tRejected,
                         tActive, tCompleted, tDeposits);
      var profile = await profileTask;

      if (profile == null)
        throw new Exception.NotFoundException("Tutor profile not found.");

      var recentApps = await appQuery
        .OrderByDescending(a => a.CreatedAt)
        .Take(5)
        .Select(a => new MyApplicationItemDto
        {
          ApplicationId = a.Id,
          SubjectName   = a.TutorRequest.Subject.Name,
          Status        = a.Status.ToString(),
          AppliedAt     = a.CreatedAt
        })
        .ToListAsync();

      _logger.LogInformation("TutorDashboard fetched for TutorProfileId={Id}", tutorProfileId);

      return new TutorDashboardDto
      {
        TotalApplications    = await tTotal,
        PendingApplications  = await tPending,
        AcceptedApplications = await tAccepted,
        RejectedApplications = await tRejected,
        ActiveClasses        = await tActive,
        CompletedClasses     = await tCompleted,
        TotalDeposits        = await tDeposits ?? 0m,
        AverageRating        = profile.Rating,
        TotalReviews         = profile.TotalReviews,
        RecentApplications   = recentApps
      };
    }

    public async Task<StudentDashboardDto> GetStudentDashboardAsync(long studentUserId)
    {
      var reqQuery = _db.TutorRequests
        .Where(r => r.StudentId == studentUserId && !r.IsDeleted);

      var tTotal     = reqQuery.CountAsync();
      var tOpen      = reqQuery.CountAsync(r => r.Status == TutorRequestStatus.Open);
      var tClosed    = reqQuery.CountAsync(r => r.Status == TutorRequestStatus.Closed
                                             || r.Status == TutorRequestStatus.Assigned
                                             || r.Status == TutorRequestStatus.Expired);
      var tAppsTotal = _db.Applications
                          .CountAsync(a => a.TutorRequest.StudentId == studentUserId && !a.IsDeleted);
      var tAppsPend  = _db.Applications
                          .CountAsync(a => a.TutorRequest.StudentId == studentUserId
                                       && a.Status == ApplicationStatus.Pending
                                       && !a.IsDeleted);
      var tActive    = _db.Classes.CountAsync(c => c.StudentId == studentUserId
                                               && c.Status == ClassStatus.Active
                                               && !c.IsDeleted);
      var tCompleted = _db.Classes.CountAsync(c => c.StudentId == studentUserId
                                               && c.Status == ClassStatus.Completed
                                               && !c.IsDeleted);

      await Task.WhenAll(tTotal, tOpen, tClosed, tAppsTotal, tAppsPend, tActive, tCompleted);

      var recentReqs = await reqQuery
        .OrderByDescending(r => r.CreatedAt)
        .Take(3)
        .Select(r => new RecentRequestItemDto
        {
          RequestId        = r.Id,
          SubjectName      = r.Subject.Name,
          Status           = r.Status.ToString(),
          ApplicationCount = r.Applications.Count(a => !a.IsDeleted),
          CreatedAt        = r.CreatedAt
        })
        .ToListAsync();

      _logger.LogInformation("StudentDashboard fetched for UserId={Id}", studentUserId);

      return new StudentDashboardDto
      {
        TotalRequests               = await tTotal,
        OpenRequests                = await tOpen,
        ClosedRequests              = await tClosed,
        TotalApplicationsReceived   = await tAppsTotal,
        PendingApplicationsReceived = await tAppsPend,
        ActiveClasses               = await tActive,
        CompletedClasses            = await tCompleted,
        RecentRequests              = recentReqs
      };
    }
  }
}
