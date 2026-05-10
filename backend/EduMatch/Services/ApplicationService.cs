using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.Data;
using EduMatch.DTOs;
using EduMatch.DTOs.Applications;
using EduMatch.Repositories;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Services
{
  public class ApplicationService : IApplicationService
  {
    private readonly IApplicationRepository _applicationRepository;
    private readonly ITutorRequestRepository _tutorRequestRepository;
    private readonly ITutorRepository _tutorRepository;
    private readonly AppDbContext _dbContext;
    private readonly INotificationService _notificationService;
    private readonly ILogger<ApplicationService> _logger;
    private readonly ICodeGeneratorService _codeGenerator;

    public ApplicationService(
      IApplicationRepository applicationRepository,
      ITutorRequestRepository tutorRequestRepository,
      ITutorRepository tutorRepository,
      AppDbContext dbContext,
      INotificationService notificationService,
      ILogger<ApplicationService> logger,
      ICodeGeneratorService codeGenerator)
    {
      _applicationRepository = applicationRepository;
      _tutorRequestRepository = tutorRequestRepository;
      _tutorRepository = tutorRepository;
      _dbContext = dbContext;
      _notificationService = notificationService;
      _logger = logger;
      _codeGenerator = codeGenerator;
    }

    public async Task<ApiResponse<ApplicationResponseDto>> ApplyAsync(long tutorUserId, long requestId, ApplyToRequestDto dto)
    {
      var tutorProfile = await _tutorRepository.GetTutorProfileByUserIdAsync(tutorUserId);
      if (tutorProfile == null)
      {
        throw new NotFoundException("Không tìm thấy hồ sơ gia sư.", "TUTOR_PROFILE_NOT_FOUND");
      }

      var request = await _tutorRequestRepository.GetByIdAsync(requestId);
      if (request == null)
      {
        throw new NotFoundException("Không tìm thấy bài đăng.", "TUTOR_REQUEST_NOT_FOUND");
      }

      if (!CanApplyToRequest(request))
      {
        throw new ValidationException("Bài đăng không còn mở để ứng tuyển.", "REQUEST_NOT_OPEN");
      }

      var existingApplication = await _applicationRepository.GetByTutorAndRequestAsync(tutorProfile.Id, requestId);
      if (existingApplication != null)
      {
        throw new ConflictException("Gia sư đã ứng tuyển bài đăng này rồi.", "APPLICATION_ALREADY_EXISTS");
      }

      var application = new EduMatch.Models.Application
      {
        TutorId = tutorProfile.Id,
        TutorRequestId = requestId,
        Message = string.IsNullOrWhiteSpace(dto.Message) ? null : dto.Message.Trim(),
        Status = ApplicationStatus.Pending
      };

      await _applicationRepository.CreateAsync(application);

      var tutorUser = tutorProfile.User ?? throw new InvalidOperationException("Tutor user was not loaded.");
      application.Tutor = tutorProfile;
      application.TutorRequest = request;

      await _notificationService.SendAsync(
        request.StudentId,
        "Ứng tuyển mới",
        $"{tutorUser.FullName} vừa ứng tuyển bài đăng của bạn",
        NotificationType.ApplicationCreated,
        "Application",
        application.Id,
        $"/tutor-requests/{request.Id}/applications");

      _logger.LogInformation("Tutor {TutorId} applied to Request {RequestId}", tutorProfile.Id, requestId);

      return ApiResponse<ApplicationResponseDto>.SuccessResult(MapApplication(application), "Ứng tuyển thành công");
    }

    public async Task<ApiResponse<ApplicationResponseDto>> GetByIdAsync(long applicationId, long currentUserId, bool isAdmin)
    {
      var application = await _applicationRepository.GetByIdAsync(applicationId);
      if (application == null)
      {
        throw new NotFoundException("Không tìm thấy ứng tuyển.", "APPLICATION_NOT_FOUND");
      }

      var tutor = EnsureTutorLoaded(application);
      var tutorRequest = EnsureTutorRequestLoaded(application);

      if (!isAdmin
        && tutor.UserId != currentUserId
        && tutorRequest.StudentId != currentUserId)
      {
        throw new ForbiddenException("Bạn không có quyền xem ứng tuyển này.", "APPLICATION_VIEW_FORBIDDEN");
      }

      return ApiResponse<ApplicationResponseDto>.SuccessResult(MapApplication(application));
    }

    public async Task<ApiResponse<bool>> StudentConfirmAsync(long applicationId, long studentId)
    {
      var application = await GetOwnedApplicationAsync(applicationId, studentId);
      if (application.Status != ApplicationStatus.Pending)
      {
        throw new ConflictException("Ứng tuyển không ở trạng thái chờ xác nhận.", "APPLICATION_INVALID_STATUS");
      }

      application.Status = ApplicationStatus.StudentConfirmed;
      await _applicationRepository.UpdateAsync(application);

      var adminIds = await GetAdminUserIdsAsync();
      await _notificationService.SendToMultipleAsync(
        adminIds,
        "Học sinh xác nhận gia sư",
        $"Học sinh đã xác nhận gia sư cho bài đăng #{application.TutorRequestId}",
        NotificationType.StudentConfirmed,
        "Application",
        application.Id,
        $"/admin/applications/{application.Id}");

      return ApiResponse<bool>.SuccessResult(true, "Đã xác nhận gia sư");
    }

    public async Task<ApiResponse<bool>> StudentRejectAsync(long applicationId, long studentId)
    {
      var application = await GetOwnedApplicationAsync(applicationId, studentId);
      if (application.Status is ApplicationStatus.AdminApproved or ApplicationStatus.BothAccepted)
      {
        throw new ConflictException("Không thể từ chối ứng tuyển ở trạng thái hiện tại.", "APPLICATION_INVALID_STATUS");
      }

      var tutor = EnsureTutorLoaded(application);
      application.Status = ApplicationStatus.StudentRejected;
      await _applicationRepository.UpdateAsync(application);

      await _notificationService.SendAsync(
        tutor.UserId,
        "Ứng tuyển bị từ chối",
        "Ứng tuyển của bạn đã bị học sinh từ chối",
        NotificationType.StudentRejected,
        "Application",
        application.Id,
        $"/applications/{application.Id}");

      return ApiResponse<bool>.SuccessResult(true, "Đã từ chối gia sư");
    }

    public async Task<ApiResponse<bool>> StudentAcceptMatchAsync(long applicationId, long studentId)
    {
      var application = await GetOwnedApplicationAsync(applicationId, studentId);
      if (application.Status != ApplicationStatus.AdminMatched)
      {
        throw new ConflictException("Yêu cầu ghép lớp này không ở trạng thái có thể chấp nhận.", "APPLICATION_INVALID_STATUS");
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
        throw new NotFoundException("Không tìm thấy ứng tuyển.", "APPLICATION_NOT_FOUND");
      }

      var tutor = EnsureTutorLoaded(application);
      if (tutor.UserId != tutorUserId)
      {
        throw new ForbiddenException("Bạn không có quyền thao tác ứng tuyển này.", "APPLICATION_ACTION_FORBIDDEN");
      }

      if (application.Status != ApplicationStatus.AdminMatched)
      {
        throw new ConflictException("Yêu cầu ghép lớp này không ở trạng thái có thể chấp nhận.", "APPLICATION_INVALID_STATUS");
      }

      application.TutorAcceptedMatch = true;
      await FinalizeMatchIfReadyAsync(application);

      return ApiResponse<bool>.SuccessResult(true, "Gia sư đã chấp nhận ghép lớp");
    }

    public async Task<ApiResponse<bool>> AdminApproveAsync(long applicationId, decimal depositAmount)
    {
      var application = await _applicationRepository.GetByIdAsync(applicationId);
      if (application == null)
      {
        throw new NotFoundException("Không tìm thấy ứng tuyển.", "APPLICATION_NOT_FOUND");
      }

      if (application.Status == ApplicationStatus.AdminApproved)
      {
        throw new ConflictException("Ứng tuyển này đã được duyệt rồi.", "APPLICATION_ALREADY_APPROVED");
      }

      if (application.Status != ApplicationStatus.StudentConfirmed)
      {
        throw new ConflictException("Ứng tuyển không ở trạng thái có thể duyệt.", "APPLICATION_INVALID_STATUS");
      }

      var tutor = EnsureTutorLoaded(application);
      var tutorRequest = EnsureTutorRequestLoaded(application);

      application.Status = ApplicationStatus.AdminApproved;
      tutorRequest.Status = TutorRequestStatus.Assigned;

      await RejectOtherApplicationsAsync(application.TutorRequestId, application.Id);
      await _applicationRepository.UpdateAsync(application);

      _logger.LogInformation("Admin approved Application {AppId}, created Class", applicationId);

      var newClass = new EduMatch.Models.Class
      {
        Code = _codeGenerator.GenerateTemporaryCode("CLS"),
        StudentId = tutorRequest.StudentId,
        TutorId = application.TutorId,
        RequestId = application.TutorRequestId,
        ApplicationId = application.Id,
        DepositAmount = depositAmount,
        Status = ClassStatus.PendingPayment,
        StartDate = DateTime.UtcNow
      };

      _dbContext.Classes.Add(newClass);
      await _dbContext.SaveChangesAsync();

      newClass.Code = _codeGenerator.GenerateClassCode(newClass.Id);
      await _dbContext.SaveChangesAsync();

      await _notificationService.SendToMultipleAsync(
        new[] { tutorRequest.StudentId, tutor.UserId },
        "Ứng tuyển được duyệt",
        "Ứng tuyển đã được admin duyệt",
        NotificationType.ApplicationApproved,
        "Application",
        application.Id,
        $"/applications/{application.Id}");

      return ApiResponse<bool>.SuccessResult(true, "Admin đã duyệt ứng tuyển");
    }

    public async Task<ApiResponse<bool>> AdminRejectAsync(long applicationId)
    {
      var application = await _applicationRepository.GetByIdAsync(applicationId);
      if (application == null)
      {
        throw new NotFoundException("Không tìm thấy ứng tuyển.", "APPLICATION_NOT_FOUND");
      }

      if (application.Status is ApplicationStatus.AdminApproved or ApplicationStatus.BothAccepted)
      {
        throw new ConflictException("Không thể từ chối ứng tuyển ở trạng thái hiện tại.", "APPLICATION_INVALID_STATUS");
      }

      var tutor = EnsureTutorLoaded(application);
      application.Status = ApplicationStatus.AdminRejected;
      await _applicationRepository.UpdateAsync(application);

      await _notificationService.SendAsync(
        tutor.UserId,
        "Ứng tuyển bị từ chối",
        "Ứng tuyển của bạn đã bị admin từ chối",
        NotificationType.ApplicationRejected,
        "Application",
        application.Id,
        $"/applications/{application.Id}");

      return ApiResponse<bool>.SuccessResult(true, "Admin đã từ chối ứng tuyển");
    }

    public async Task<ApiResponse<ApplicationResponseDto>> AdminMatchAsync(long requestId, long tutorProfileId, decimal depositAmount)
    {
      var request = await _tutorRequestRepository.GetByIdAsync(requestId);
      if (request == null)
      {
        throw new NotFoundException("Không tìm thấy bài đăng.", "TUTOR_REQUEST_NOT_FOUND");
      }

      if (!CanApplyToRequest(request))
      {
        throw new ValidationException("Bài đăng không còn mở để ghép lớp.", "REQUEST_NOT_OPEN");
      }

      var tutorProfile = await _tutorRepository.GetTutorProfileDetailAsync(tutorProfileId);
      if (tutorProfile == null)
      {
        throw new NotFoundException("Không tìm thấy gia sư.", "TUTOR_PROFILE_NOT_FOUND");
      }

      var existingApplication = await _applicationRepository.GetByTutorAndRequestAsync(tutorProfileId, requestId);
      if (existingApplication != null)
      {
        throw new ConflictException("Gia sư đã có kết nối với bài đăng này.", "APPLICATION_ALREADY_EXISTS");
      }

      var application = new EduMatch.Models.Application
      {
        TutorId = tutorProfileId,
        TutorRequestId = requestId,
        Status = ApplicationStatus.AdminMatched,
        StudentAcceptedMatch = false,
        TutorAcceptedMatch = false,
        DepositAmount = depositAmount
      };

      await _applicationRepository.CreateAsync(application);

      application.Tutor = tutorProfile;
      application.TutorRequest = request;

      await _notificationService.SendToMultipleAsync(
        new[] { request.StudentId, tutorProfile.UserId },
        "Ghép lớp mới",
        "Admin đã tạo ghép lớp mới",
        NotificationType.AdminMatched,
        "Application",
        application.Id,
        $"/applications/{application.Id}");

      return ApiResponse<ApplicationResponseDto>.SuccessResult(MapApplication(application), "Admin ghép lớp thành công");
    }

    public async Task<ApiResponse<PagedResult<ApplicationResponseDto>>> GetByRequestIdAsync(long requestId, long studentId, int page, int pageSize)
    {
      var request = await _tutorRequestRepository.GetByIdAsync(requestId);
      if (request == null)
      {
        throw new NotFoundException("Không tìm thấy bài đăng.", "TUTOR_REQUEST_NOT_FOUND");
      }

      if (request.StudentId != studentId)
      {
        throw new ForbiddenException("Bạn không có quyền xem danh sách ứng tuyển này.", "APPLICATION_VIEW_FORBIDDEN");
      }

      var pagedApplications = await _applicationRepository.GetByRequestIdAsync(requestId, page, pageSize);
      return ApiResponse<PagedResult<ApplicationResponseDto>>.SuccessResult(MapPagedApplications(pagedApplications));
    }

    public async Task<ApiResponse<PagedResult<ApplicationResponseDto>>> GetMyApplicationsAsync(long tutorUserId, int page, int pageSize)
    {
      var tutorProfile = await _tutorRepository.GetTutorProfileByUserIdAsync(tutorUserId);
      if (tutorProfile == null)
      {
        throw new NotFoundException("Không tìm thấy hồ sơ gia sư.", "TUTOR_PROFILE_NOT_FOUND");
      }

      var pagedApplications = await _applicationRepository.GetByTutorProfileIdAsync(tutorProfile.Id, page, pageSize);
      return ApiResponse<PagedResult<ApplicationResponseDto>>.SuccessResult(MapPagedApplications(pagedApplications));
    }

    public async Task<ApiResponse<PagedResult<ApplicationResponseDto>>> GetAllForAdminAsync(ApplicationQueryParameters parameters)
    {
      var pagedApplications = await _applicationRepository.GetAllAsync(parameters.Page, parameters.PageSize, parameters.Status);
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
        throw new NotFoundException("Không tìm thấy ứng tuyển.", "APPLICATION_NOT_FOUND");
      }

      var tutorRequest = EnsureTutorRequestLoaded(application);
      if (tutorRequest.StudentId != studentId)
      {
        throw new ForbiddenException("Bạn không có quyền thao tác ứng tuyển này.", "APPLICATION_ACTION_FORBIDDEN");
      }

      return application;
    }

    private async Task FinalizeMatchIfReadyAsync(EduMatch.Models.Application application)
    {
      if (application.StudentAcceptedMatch && application.TutorAcceptedMatch)
      {
        var tutor = EnsureTutorLoaded(application);
        var tutorRequest = EnsureTutorRequestLoaded(application);

        application.Status = ApplicationStatus.BothAccepted;
        tutorRequest.Status = TutorRequestStatus.Assigned;

        await RejectOtherApplicationsAsync(application.TutorRequestId, application.Id);

        var newClass = new EduMatch.Models.Class
        {
          Code = _codeGenerator.GenerateTemporaryCode("CLS"),
          StudentId = tutorRequest.StudentId,
          TutorId = application.TutorId,
          RequestId = application.TutorRequestId,
          ApplicationId = application.Id,
          DepositAmount = application.DepositAmount ?? 0,
          Status = ClassStatus.PendingPayment,
          StartDate = DateTime.UtcNow
        };

        _dbContext.Classes.Add(newClass);
        await _dbContext.SaveChangesAsync();

        newClass.Code = _codeGenerator.GenerateClassCode(newClass.Id);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation(
          "Class created for matched Application {AppId}, DepositAmount {Deposit}",
          application.Id,
          application.DepositAmount);

        await _notificationService.SendToMultipleAsync(
          new[] { tutorRequest.StudentId, tutor.UserId },
          "Ghép lớp thành công",
          "Ghép lớp đã được cả hai bên chấp nhận",
          NotificationType.MatchAccepted,
          "Application",
          application.Id,
          $"/applications/{application.Id}");
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

    private static EduMatch.Models.Tutor EnsureTutorLoaded(EduMatch.Models.Application application)
    {
      return application.Tutor ?? throw new InvalidOperationException("Application tutor was not loaded.");
    }

    private static EduMatch.Models.TutorRequest EnsureTutorRequestLoaded(EduMatch.Models.Application application)
    {
      return application.TutorRequest ?? throw new InvalidOperationException("Application tutor request was not loaded.");
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
  }
}
