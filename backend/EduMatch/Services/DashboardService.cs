using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.Data;
using EduMatch.DTOs.Dashboard;
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

      var totalUsers = await _db.Users.CountAsync(u => u.Role != UserRole.Admin && !u.IsDeleted);
      var students = await _db.Users.CountAsync(u => u.Role == UserRole.Student && !u.IsDeleted);
      var tutors = await _db.Users.CountAsync(u => u.Role == UserRole.Tutor && !u.IsDeleted);
      var totalReqs = await _db.TutorRequests.CountAsync(r => !r.IsDeleted);
      var openReqs = await _db.TutorRequests.CountAsync(r => r.Status == TutorRequestStatus.Open && !r.IsDeleted);
      var pendingApps = await _db.Applications.CountAsync(a => a.Status == ApplicationStatus.Pending && !a.IsDeleted);
      var activeClass = await _db.Classes.CountAsync(c => c.Status == ClassStatus.Active && !c.IsDeleted);
      var pendingCls = await _db.Classes.CountAsync(c => c.Status == ClassStatus.PendingStart && !c.IsDeleted);
      var cancelledCls = await _db.Classes.CountAsync(c =>
        (c.Status == ClassStatus.CancelledByStudent
         || c.Status == ClassStatus.CancelledByTutor
         || c.Status == ClassStatus.CancelledByAdmin)
        && !c.IsDeleted);
      var revTotal = await _db.Payments
                              .Where(p => p.Status == PaymentStatus.Success && !p.IsDeleted)
                              .SumAsync(p => (decimal?)p.Amount);
      var revMonth = await _db.Payments
                              .Where(p => p.Status == PaymentStatus.Success
                                       && p.PaidAt >= startOfMonth
                                       && !p.IsDeleted)
                              .SumAsync(p => (decimal?)p.Amount);

      var recentApps = await _db.Applications
        .Where(a => !a.IsDeleted)
        .OrderByDescending(a => a.CreatedAt)
        .Take(5)
        .Select(a => new RecentApplicationItemDto
        {
          Id = a.Id,
          TutorName = a.Tutor.User.FullName,
          SubjectName = a.TutorRequest.Subject.Name,
          Status = a.Status.ToString(),
          AppliedAt = a.CreatedAt
        })
        .ToListAsync();

      _logger.LogInformation("AdminDashboard fetched successfully");

      return new AdminDashboardDto
      {
        TotalUsers = totalUsers,
        TotalStudents = students,
        TotalTutors = tutors,
        PendingTutorApprovals = 0,
        TotalRequests = totalReqs,
        OpenRequests = openReqs,
        PendingApplications = pendingApps,
        ActiveClasses = activeClass,
        PendingClasses = pendingCls,
        CancelledClasses = cancelledCls,
        TotalRevenue = revTotal ?? 0m,
        RevenueThisMonth = revMonth ?? 0m,
        RecentApplications = recentApps,
        PendingTutors = []
      };
    }

    public async Task<TutorDashboardDto> GetTutorDashboardAsync(long tutorProfileId)
    {
      var appQuery = _db.Applications
        .Where(a => a.TutorId == tutorProfileId && !a.IsDeleted);

      var total = await appQuery.CountAsync();
      var pending = await appQuery.CountAsync(a => a.Status == ApplicationStatus.Pending);
      var accepted = await appQuery.CountAsync(a => a.Status == ApplicationStatus.BothAccepted);
      var rejected = await appQuery.CountAsync(a => a.Status == ApplicationStatus.AdminRejected
                                             || a.Status == ApplicationStatus.StudentRejected);
      var active = await _db.Classes.CountAsync(c => c.TutorId == tutorProfileId
                                                && c.Status == ClassStatus.Active
                                                && !c.IsDeleted);
      var pendingCls = await _db.Classes.CountAsync(c => c.TutorId == tutorProfileId
                                                && c.Status == ClassStatus.PendingStart
                                                && !c.IsDeleted);
      var cancelledCls = await _db.Classes.CountAsync(c => c.TutorId == tutorProfileId
                                                && (c.Status == ClassStatus.CancelledByStudent
                                                    || c.Status == ClassStatus.CancelledByTutor
                                                    || c.Status == ClassStatus.CancelledByAdmin)
                                                && !c.IsDeleted);
      var deposits = await _db.Payments
                          .Where(p => p.TutorId == tutorProfileId
                                   && p.Status == PaymentStatus.Success
                                   && !p.IsDeleted)
                          .SumAsync(p => (decimal?)p.Amount);

      var profile = await _db.Tutors
        .AsNoTracking()
        .FirstOrDefaultAsync(t => t.Id == tutorProfileId && !t.IsDeleted);

      if (profile == null)
        throw new NotFoundException("Tutor profile not found.");

      var recentApps = await appQuery
        .OrderByDescending(a => a.CreatedAt)
        .Take(5)
        .Select(a => new MyApplicationItemDto
        {
          ApplicationId = a.Id,
          SubjectName = a.TutorRequest.Subject.Name,
          Status = a.Status.ToString(),
          AppliedAt = a.CreatedAt
        })
        .ToListAsync();

      _logger.LogInformation("TutorDashboard fetched for TutorId={Id}", tutorProfileId);

      return new TutorDashboardDto
      {
        TotalApplications = total,
        PendingApplications = pending,
        AcceptedApplications = accepted,
        RejectedApplications = rejected,
        ActiveClasses = active,
        PendingClasses = pendingCls,
        CancelledClasses = cancelledCls,
        TotalDeposits = deposits ?? 0m,
        AverageRating = profile.Rating,
        TotalReviews = profile.TotalReviews,
        RecentApplications = recentApps
      };
    }

    public async Task<StudentDashboardDto> GetStudentDashboardAsync(long studentUserId)
    {
      var reqQuery = _db.TutorRequests
        .Where(r => r.StudentId == studentUserId && !r.IsDeleted);

      var total = await reqQuery.CountAsync();
      var open = await reqQuery.CountAsync(r => r.Status == TutorRequestStatus.Open);
      var closed = await reqQuery.CountAsync(r => r.Status == TutorRequestStatus.Closed
                                             || r.Status == TutorRequestStatus.Assigned
                                             || r.Status == TutorRequestStatus.Expired);
      var appsTotal = await _db.Applications
                          .CountAsync(a => a.TutorRequest.StudentId == studentUserId && !a.IsDeleted);
      var appsPend = await _db.Applications
                          .CountAsync(a => a.TutorRequest.StudentId == studentUserId
                                       && a.Status == ApplicationStatus.Pending
                                       && !a.IsDeleted);
      var active = await _db.Classes.CountAsync(c => c.StudentId == studentUserId
                                               && c.Status == ClassStatus.Active
                                               && !c.IsDeleted);
      var pendingCls = await _db.Classes.CountAsync(c => c.StudentId == studentUserId
                                               && c.Status == ClassStatus.PendingStart
                                               && !c.IsDeleted);
      var cancelledCls = await _db.Classes.CountAsync(c => c.StudentId == studentUserId
                                               && (c.Status == ClassStatus.CancelledByStudent
                                                   || c.Status == ClassStatus.CancelledByTutor
                                                   || c.Status == ClassStatus.CancelledByAdmin)
                                               && !c.IsDeleted);

      var recentReqs = await reqQuery
        .OrderByDescending(r => r.CreatedAt)
        .Take(3)
        .Select(r => new RecentRequestItemDto
        {
          RequestId = r.Id,
          SubjectName = r.Subject.Name,
          Status = r.Status.ToString(),
          ApplicationCount = r.Applications.Count(a => !a.IsDeleted),
          CreatedAt = r.CreatedAt
        })
        .ToListAsync();

      _logger.LogInformation("StudentDashboard fetched for UserId={Id}", studentUserId);

      return new StudentDashboardDto
      {
        TotalRequests = total,
        OpenRequests = open,
        ClosedRequests = closed,
        TotalApplicationsReceived = appsTotal,
        PendingApplicationsReceived = appsPend,
        ActiveClasses = active,
        PendingClasses = pendingCls,
        CancelledClasses = cancelledCls,
        RecentRequests = recentReqs
      };
    }
  }
}
