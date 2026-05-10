using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.Data;
using EduMatch.DTOs;
using EduMatch.DTOs.Dashboard;
using EduMatch.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Services
{
  public class TutorApprovalService : ITutorApprovalService
  {
    private readonly AppDbContext _db;
    private readonly INotificationService _notif;
    private readonly ILogger<TutorApprovalService> _logger;

    public TutorApprovalService(
      AppDbContext db,
      INotificationService notif,
      ILogger<TutorApprovalService> logger)
    {
      _db = db;
      _notif = notif;
      _logger = logger;
    }

    public async Task<PagedResult<PendingTutorItemDto>> GetPendingTutorsAsync(int page, int pageSize)
    {
      var query = _db.TutorProfiles
        .Where(t => t.ApprovalStatus == ApprovalStatus.Pending && !t.IsDeleted)
        .OrderBy(t => t.CreatedAt);

      var total = await query.CountAsync();
      var items = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(t => new PendingTutorItemDto
        {
          TutorProfileId = t.Id,
          FullName = t.User.FullName,
          AvatarUrl = t.User.AvatarFile != null ? t.User.AvatarFile.FilePath : null,
          Bio = t.Bio,
          HourlyRate = t.HourlyRate,
          RequestedAt = t.CreatedAt
        })
        .ToListAsync();

      return new PagedResult<PendingTutorItemDto>
      {
        Items = items,
        TotalCount = total,
        Page = page,
        PageSize = pageSize,
        TotalPages = (int)Math.Ceiling(total / (double)pageSize)
      };
    }

    public async Task ApproveAsync(long tutorProfileId)
    {
      var profile = await _db.TutorProfiles
        .Include(t => t.User)
        .FirstOrDefaultAsync(t => t.Id == tutorProfileId && !t.IsDeleted)
        ?? throw new NotFoundException("TutorProfile not found");

      if (profile.ApprovalStatus != ApprovalStatus.Pending)
      {
        throw new AppException("Tutor request is not pending.", StatusCodes.Status400BadRequest);
      }

      var user = profile.User ?? throw new InvalidOperationException("Tutor user was not loaded.");
      profile.ApprovalStatus = ApprovalStatus.Approved;
      user.Role = UserRole.Tutor;

      await _db.SaveChangesAsync();

      _logger.LogInformation("TutorProfile {Id} approved. UserId={UserId}", tutorProfileId, profile.UserId);

      await _notif.SendAsync(
        profile.UserId,
        "Yêu cầu gia sư được duyệt",
        "Yêu cầu trở thành Gia sư của bạn đã được duyệt. Chào mừng bạn!",
        NotificationType.TutorApproved,
        referenceType: "TutorProfile",
        referenceId: tutorProfileId,
        actionUrl: "/tutor/dashboard");
    }

    public async Task RejectAsync(long tutorProfileId)
    {
      var profile = await _db.TutorProfiles
        .Include(t => t.User)
        .FirstOrDefaultAsync(t => t.Id == tutorProfileId && !t.IsDeleted)
        ?? throw new NotFoundException("TutorProfile not found");

      if (profile.ApprovalStatus != ApprovalStatus.Pending)
      {
        throw new AppException("Tutor request is not pending.", StatusCodes.Status400BadRequest);
      }

      profile.ApprovalStatus = ApprovalStatus.Rejected;

      await _db.SaveChangesAsync();

      _logger.LogInformation("TutorProfile {Id} rejected. UserId={UserId}", tutorProfileId, profile.UserId);

      await _notif.SendAsync(
        profile.UserId,
        "Yêu cầu gia sư bị từ chối",
        "Yêu cầu trở thành Gia sư của bạn đã bị từ chối.",
        NotificationType.TutorRejected,
        referenceType: "TutorProfile",
        referenceId: tutorProfileId,
        actionUrl: "/profile");
    }
  }
}
