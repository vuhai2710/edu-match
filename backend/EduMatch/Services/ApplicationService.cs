using EduMatch.Configuration;
using EduMatch.Data;
using EduMatch.DTOs;
using EduMatch.DTOs.Applications;
using EduMatch.Enums;
using EduMatch.Exception;
using EduMatch.Repositories;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Services
{
  public class ApplicationService : IApplicationService
  {
    private readonly IApplicationRepository _applicationRepository;
    private readonly ITutorRequestRepository _tutorRequestRepository;
    private readonly ITutorRepository _tutorRepository;
    private readonly AppDbContext _dbContext;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<ApplicationService> _logger;

    public ApplicationService(
      IApplicationRepository applicationRepository,
      ITutorRequestRepository tutorRequestRepository,
      ITutorRepository tutorRepository,
      AppDbContext dbContext,
      IHubContext<NotificationHub> hubContext,
      ILogger<ApplicationService> logger)
    {
      _applicationRepository = applicationRepository;
      _tutorRequestRepository = tutorRequestRepository;
      _tutorRepository = tutorRepository;
      _dbContext = dbContext;
      _hubContext = hubContext;
      _logger = logger;
    }

    public async Task<ApiResponse<ApplicationResponseDto>> ApplyAsync(long tutorUserId, long requestId, ApplyToRequestDto dto)
    {
      var tutorProfile = await _tutorRepository.GetTutorProfileByUserIdAsync(tutorUserId);
      if (tutorProfile == null)
      {
        throw new AppException("Không tìm thấy hồ sơ gia sư", 404);
      }

      var request = await _tutorRequestRepository.GetByIdAsync(requestId);
      if (request == null)
      {
        throw new AppException("Không tìm thấy bài đăng", 404);
      }

      if (!CanApplyToRequest(request))
      {
        throw new AppException("Bài đăng đã hết hạn ứng tuyển", 400);
      }

      var existingApplication = await _applicationRepository.GetByTutorAndRequestAsync(tutorProfile.Id, requestId);
      if (existingApplication != null)
      {
        throw new AppException("Gia sư không thể apply cùng một bài đăng hai lần", 400);
      }

      var application = new EduMatch.Models.Application
      {
        TutorId = tutorProfile.Id,
        TutorRequestId = requestId,
        Message = string.IsNullOrWhiteSpace(dto.Message) ? null : dto.Message.Trim(),
        Status = ApplicationStatus.Pending
      };

      await _applicationRepository.CreateAsync(application);

      application.Tutor = tutorProfile;
      application.TutorRequest = request;

      await CreateNotificationsAsync(
        new[] { request.StudentId },
        $"{tutorProfile.User.FullName} vừa ứng tuyển bài đăng của bạn",
        $"/tutor-requests/{request.Id}/applications");

      await _hubContext.Clients.User(request.StudentId.ToString()).SendAsync("NewApplication", new
      {
        applicationId = application.Id,
        requestId = request.Id,
        tutorProfileId = tutorProfile.Id,
        tutorName = tutorProfile.User.FullName
      });

      _logger.LogInformation("Tutor {TutorId} applied to Request {RequestId}", tutorProfile.Id, requestId);

      return ApiResponse<ApplicationResponseDto>.SuccessResult(MapApplication(application), "Ứng tuyển thành công");
    }

    public async Task<ApiResponse<bool>> StudentConfirmAsync(long applicationId, long studentId)
    {
      var application = await GetOwnedApplicationAsync(applicationId, studentId);
      if (application.Status != ApplicationStatus.Pending)
      {
        throw new AppException("Ứng tuyển không ở trạng thái chờ xác nhận", 400);
      }

      application.Status = ApplicationStatus.StudentConfirmed;
      await _applicationRepository.UpdateAsync(application);

      var adminIds = await GetAdminUserIdsAsync();
      await CreateNotificationsAsync(
        adminIds,
        $"Học sinh đã xác nhận gia sư cho bài đăng #{application.TutorRequestId}",
        $"/admin/applications/{application.Id}");

      await _hubContext.Clients.Group("Admin").SendAsync("ApplicationStudentConfirmed", new
      {
        applicationId = application.Id,
        requestId = application.TutorRequestId,
        studentId
      });

      return ApiResponse<bool>.SuccessResult(true, "Đã xác nhận gia sư");
    }

    public async Task<ApiResponse<bool>> StudentRejectAsync(long applicationId, long studentId)
    {
      var application = await GetOwnedApplicationAsync(applicationId, studentId);
      if (application.Status is ApplicationStatus.AdminApproved or ApplicationStatus.BothAccepted)
      {
        throw new AppException("Không thể từ chối ứng tuyển này", 400);
      }

      application.Status = ApplicationStatus.StudentRejected;
      await _applicationRepository.UpdateAsync(application);

      await CreateNotificationsAsync(
        new[] { application.Tutor.UserId },
        "Ứng tuyển của bạn đã bị học sinh từ chối",
        $"/applications/{application.Id}");

      return ApiResponse<bool>.SuccessResult(true, "Đã từ chối gia sư");
    }

    public async Task<ApiResponse<bool>> StudentAcceptMatchAsync(long applicationId, long studentId)
    {
      var application = await GetOwnedApplicationAsync(applicationId, studentId);
      if (application.Status != ApplicationStatus.AdminMatched)
      {
        throw new AppException("Yêu cầu ghép này không hợp lệ", 400);
      }

      application.StudentAcceptedMatch = true;
      await FinalizeMatchIfReadyAsync(application);

      return ApiResponse<bool>.SuccessResult(true, "Học sinh đã chấp nhận ghép lớp");
    }

    public async Task<ApiResponse<bool>> TutorAcceptMatchAsync(long applicationId, long tutorUserId)
    {
      var application = await _applicationRepository.GetByIdAsync(applicationId);
      if (application == null)
      {
        throw new AppException("Không tìm thấy ứng tuyển", 404);
      }

      if (application.Tutor.UserId != tutorUserId)
      {
        throw new AppException("Bạn không có quyền thao tác ứng tuyển này", 403);
      }

      if (application.Status != ApplicationStatus.AdminMatched)
      {
        throw new AppException("Yêu cầu ghép này không hợp lệ", 400);
      }

      application.TutorAcceptedMatch = true;
      await FinalizeMatchIfReadyAsync(application);

      return ApiResponse<bool>.SuccessResult(true, "Gia sư đã chấp nhận ghép lớp");
    }

    public async Task<ApiResponse<bool>> AdminApproveAsync(long applicationId)
    {
      var application = await _applicationRepository.GetByIdAsync(applicationId);
      if (application == null)
      {
        throw new AppException("Không tìm thấy ứng tuyển", 404);
      }

      if (application.Status != ApplicationStatus.StudentConfirmed)
      {
        throw new AppException("Ứng tuyển chưa được học sinh xác nhận", 400);
      }

      application.Status = ApplicationStatus.AdminApproved;
      application.TutorRequest.Status = TutorRequestStatus.Assigned;

      await RejectOtherApplicationsAsync(application.TutorRequestId, application.Id);
      await _applicationRepository.UpdateAsync(application);

      _logger.LogInformation("Admin approved Application {AppId}, created Class", applicationId);
      _logger.LogInformation("TODO: create Class entity for Application {AppId}", applicationId);

      await CreateNotificationsAsync(
        new[] { application.TutorRequest.StudentId, application.Tutor.UserId },
        "Ứng tuyển đã được admin duyệt",
        $"/applications/{application.Id}");

      await _hubContext.Clients.Users(new[] { application.TutorRequest.StudentId.ToString(), application.Tutor.UserId.ToString() })
        .SendAsync("ApplicationApproved", new
        {
          applicationId = application.Id,
          requestId = application.TutorRequestId,
          tutorProfileId = application.TutorId
        });

      return ApiResponse<bool>.SuccessResult(true, "Admin đã duyệt ứng tuyển");
    }

    public async Task<ApiResponse<bool>> AdminRejectAsync(long applicationId)
    {
      var application = await _applicationRepository.GetByIdAsync(applicationId);
      if (application == null)
      {
        throw new AppException("Không tìm thấy ứng tuyển", 404);
      }

      if (application.Status is ApplicationStatus.AdminApproved or ApplicationStatus.BothAccepted)
      {
        throw new AppException("Không thể từ chối ứng tuyển này", 400);
      }

      application.Status = ApplicationStatus.AdminRejected;
      await _applicationRepository.UpdateAsync(application);

      await CreateNotificationsAsync(
        new[] { application.Tutor.UserId },
        "Ứng tuyển của bạn đã bị admin từ chối",
        $"/applications/{application.Id}");

      await _hubContext.Clients.User(application.Tutor.UserId.ToString()).SendAsync("ApplicationRejected", new
      {
        applicationId = application.Id,
        requestId = application.TutorRequestId
      });

      return ApiResponse<bool>.SuccessResult(true, "Admin đã từ chối ứng tuyển");
    }

    public async Task<ApiResponse<ApplicationResponseDto>> AdminMatchAsync(long requestId, long tutorProfileId)
    {
      var request = await _tutorRequestRepository.GetByIdAsync(requestId);
      if (request == null)
      {
        throw new AppException("Không tìm thấy bài đăng", 404);
      }

      if (!CanApplyToRequest(request))
      {
        throw new AppException("Bài đăng đã hết hạn ứng tuyển", 400);
      }

      var tutorProfile = await _tutorRepository.GetTutorProfileDetailAsync(tutorProfileId);
      if (tutorProfile == null)
      {
        throw new AppException("Không tìm thấy gia sư", 404);
      }

      var existingApplication = await _applicationRepository.GetByTutorAndRequestAsync(tutorProfileId, requestId);
      if (existingApplication != null)
      {
        throw new AppException("Gia sư đã có kết nối với bài đăng này", 400);
      }

      var application = new EduMatch.Models.Application
      {
        TutorId = tutorProfileId,
        TutorRequestId = requestId,
        Status = ApplicationStatus.AdminMatched,
        StudentAcceptedMatch = false,
        TutorAcceptedMatch = false
      };

      await _applicationRepository.CreateAsync(application);

      application.Tutor = tutorProfile;
      application.TutorRequest = request;

      await CreateNotificationsAsync(
        new[] { request.StudentId, tutorProfile.UserId },
        "Admin đã tạo ghép lớp mới",
        $"/applications/{application.Id}");

      await _hubContext.Clients.Users(new[] { request.StudentId.ToString(), tutorProfile.UserId.ToString() })
        .SendAsync("AdminMatched", new
        {
          applicationId = application.Id,
          requestId,
          tutorProfileId
        });

      return ApiResponse<ApplicationResponseDto>.SuccessResult(MapApplication(application), "Admin ghép lớp thành công");
    }

    public async Task<ApiResponse<PagedResult<ApplicationResponseDto>>> GetByRequestIdAsync(long requestId, long studentId, int page, int pageSize)
    {
      var request = await _tutorRequestRepository.GetByIdAsync(requestId);
      if (request == null)
      {
        throw new AppException("Không tìm thấy bài đăng", 404);
      }

      if (request.StudentId != studentId)
      {
        throw new AppException("Bạn không có quyền xem danh sách ứng tuyển này", 403);
      }

      var pagedApplications = await _applicationRepository.GetByRequestIdAsync(requestId, page, pageSize);
      return ApiResponse<PagedResult<ApplicationResponseDto>>.SuccessResult(MapPagedApplications(pagedApplications));
    }

    public async Task<ApiResponse<PagedResult<ApplicationResponseDto>>> GetMyApplicationsAsync(long tutorUserId, int page, int pageSize)
    {
      var tutorProfile = await _tutorRepository.GetTutorProfileByUserIdAsync(tutorUserId);
      if (tutorProfile == null)
      {
        throw new AppException("Không tìm thấy hồ sơ gia sư", 404);
      }

      var pagedApplications = await _applicationRepository.GetByTutorProfileIdAsync(tutorProfile.Id, page, pageSize);
      return ApiResponse<PagedResult<ApplicationResponseDto>>.SuccessResult(MapPagedApplications(pagedApplications));
    }

    public async Task<ApiResponse<PagedResult<ApplicationResponseDto>>> GetAllForAdminAsync(int page, int pageSize, ApplicationStatus? status)
    {
      var pagedApplications = await _applicationRepository.GetAllAsync(page, pageSize, status);
      return ApiResponse<PagedResult<ApplicationResponseDto>>.SuccessResult(MapPagedApplications(pagedApplications));
    }

    private static bool CanApplyToRequest(EduMatch.Models.TutorRequest request)
    {
      return request.Status == TutorRequestStatus.Open
        && (!request.ExpiresAt.HasValue || request.ExpiresAt.Value > DateTime.UtcNow);
    }

    private async Task<EduMatch.Models.Application> GetOwnedApplicationAsync(long applicationId, long studentId)
    {
      var application = await _applicationRepository.GetByIdAsync(applicationId);
      if (application == null)
      {
        throw new AppException("Không tìm thấy ứng tuyển", 404);
      }

      if (application.TutorRequest.StudentId != studentId)
      {
        throw new AppException("Bạn không có quyền thao tác ứng tuyển này", 403);
      }

      return application;
    }

    private async Task FinalizeMatchIfReadyAsync(EduMatch.Models.Application application)
    {
      if (application.StudentAcceptedMatch && application.TutorAcceptedMatch)
      {
        application.Status = ApplicationStatus.BothAccepted;
        application.TutorRequest.Status = TutorRequestStatus.Assigned;

        await RejectOtherApplicationsAsync(application.TutorRequestId, application.Id);

        _logger.LogInformation("TODO: create Class entity for matched Application {AppId}", application.Id);

        await CreateNotificationsAsync(
          new[] { application.TutorRequest.StudentId, application.Tutor.UserId },
          "Ghép lớp đã được cả hai bên chấp nhận",
          $"/applications/{application.Id}");

        await _hubContext.Clients.Users(new[] { application.TutorRequest.StudentId.ToString(), application.Tutor.UserId.ToString() })
          .SendAsync("MatchAccepted", new
          {
            applicationId = application.Id,
            requestId = application.TutorRequestId,
            tutorProfileId = application.TutorId
          });
      }

      await _applicationRepository.UpdateAsync(application);
    }

    private async Task RejectOtherApplicationsAsync(long requestId, long approvedApplicationId)
    {
      var otherApplications = await _applicationRepository.FindAsync(x =>
        x.TutorRequestId == requestId
        && x.Id != approvedApplicationId
        && x.Status != ApplicationStatus.AdminRejected
        && x.Status != ApplicationStatus.StudentRejected);

      foreach (var otherApplication in otherApplications)
      {
        otherApplication.Status = ApplicationStatus.AdminRejected;
      }

      if (otherApplications.Any())
      {
        await _applicationRepository.SaveChangesAsync();
      }
    }

    private static ApplicationResponseDto MapApplication(EduMatch.Models.Application application)
    {
      return new ApplicationResponseDto
      {
        Id = application.Id,
        TutorProfileId = application.TutorId,
        TutorName = application.Tutor?.User?.FullName ?? string.Empty,
        TutorAvatar = application.Tutor?.User?.AvatarFile?.FilePath ?? string.Empty,
        TutorRating = application.Tutor?.Rating ?? 0,
        TutorRequestId = application.TutorRequestId,
        Message = application.Message,
        Status = application.Status.ToString(),
        CreatedAt = application.CreatedAt
      };
    }

    private static PagedResult<ApplicationResponseDto> MapPagedApplications(PagedResult<EduMatch.Models.Application> pagedApplications)
    {
      return new PagedResult<ApplicationResponseDto>
      {
        Items = pagedApplications.Items.Select(MapApplication).ToList(),
        TotalCount = pagedApplications.TotalCount,
        Page = pagedApplications.Page,
        PageSize = pagedApplications.PageSize,
        TotalPages = pagedApplications.TotalPages
      };
    }

    private async Task<List<long>> GetAdminUserIdsAsync()
    {
      return await _dbContext.Users
        .Where(x => x.Role == UserRole.Admin)
        .Select(x => x.Id)
        .ToListAsync();
    }

    private async Task CreateNotificationsAsync(IEnumerable<long> userIds, string content, string? actionUrl)
    {
      var notifications = userIds
        .Distinct()
        .Select(userId => new EduMatch.Models.Notification
        {
          UserId = userId,
          Content = content,
          ActionUrl = actionUrl
        })
        .ToList();

      if (notifications.Count == 0)
      {
        return;
      }

      await _dbContext.Notifications.AddRangeAsync(notifications);
      await _dbContext.SaveChangesAsync();
    }
  }
}
