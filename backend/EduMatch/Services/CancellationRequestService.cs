using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.DTOs;
using EduMatch.DTOs.CancellationRequests;
using EduMatch.Mappers;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;

namespace EduMatch.Services
{
  public class CancellationRequestService : ICancellationRequestService
  {
    private readonly ICancellationRequestRepository _cancellationRequestRepository;
    private readonly IClassRepository _classRepository;
    private readonly IClassCompletionRequestRepository _classCompletionRequestRepository;
    private readonly IUserRepository _userRepository;
    private readonly INotificationService _notificationService;
    private readonly ILogger<CancellationRequestService> _logger;

    public CancellationRequestService(
      ICancellationRequestRepository cancellationRequestRepository,
      IClassRepository classRepository,
      IClassCompletionRequestRepository classCompletionRequestRepository,
      IUserRepository userRepository,
      INotificationService notificationService,
      ILogger<CancellationRequestService> logger)
    {
      _cancellationRequestRepository = cancellationRequestRepository;
      _classRepository = classRepository;
      _classCompletionRequestRepository = classCompletionRequestRepository;
      _userRepository = userRepository;
      _notificationService = notificationService;
      _logger = logger;
    }

    public async Task<ApiResponse<CancellationRequestDto>> CreateAsync(long currentUserId, UserRole role, CreateCancellationRequestDto dto)
    {
      try
      {
        var classEntity = await _classRepository.GetByIdWithDetailsAsync(dto.ClassId);
        if (classEntity == null)
        {
          throw new NotFoundException("Class not found.", "CLASS_NOT_FOUND");
        }

        var requester = await _userRepository.GetByIdAsync(currentUserId);
        if (requester == null)
        {
          throw new NotFoundException("User not found.", "USER_NOT_FOUND");
        }

        EnsureUserCanCreate(role, currentUserId, classEntity);
        EnsureClassCanCreate(role, classEntity);
        ValidateReason(dto.Reason);

        if (await _cancellationRequestRepository.HasPendingRequestForClassAsync(dto.ClassId))
        {
          throw new ConflictException("This class already has a pending cancellation request.", "CANCELLATION_REQUEST_ALREADY_PENDING");
        }

        if (role != UserRole.Admin && HasRefundInput(dto))
        {
          throw new ValidationException("Only admin can set refund information when creating a cancellation request.", "REFUND_INFO_NOT_ALLOWED");
        }

        var request = new CancellationRequest
        {
          ClassId = classEntity.Id,
          Class = classEntity,
          RequestedByUserId = currentUserId,
          RequestedByUser = requester,
          RequestedByRole = role,
          Reason = dto.Reason.Trim(),
          Status = CancellationRequestStatus.Pending
        };

        await _cancellationRequestRepository.AddAsync(request);

        if (role == UserRole.Admin)
        {
          ApplyResolution(
            request,
            classEntity,
            requester,
            dto.RefundAmount,
            dto.RefundNote,
            dto.IsRefunded ?? false);
        }

        if (role == UserRole.Admin)
        {
          await RejectPendingCompletionRequestsAsync(classEntity.Id);
        }

        await _cancellationRequestRepository.SaveChangesAsync();

        if (role == UserRole.Admin)
        {
          await NotifyCancellationCreatedAsync(request, classEntity);
          await NotifyCancellationResolvedAsync(request, classEntity);
          await NotifyClassCancelledAsync(request, classEntity);
        }
        else
        {
          await NotifyAdminsOfPendingRequestAsync(request, classEntity);
        }

        _logger.LogInformation(
          "CancellationRequest {RequestId} created for Class {ClassId} by {Role} {UserId}",
          request.Id,
          classEntity.Id,
          role,
          currentUserId);

        return ApiResponse<CancellationRequestDto>.SuccessResult(
          CancellationRequestMapper.ToDto(request),
          role == UserRole.Admin
            ? "Yêu cầu hủy lớp đã được tạo và xử lý thành công."
            : "Đã tạo yêu cầu hủy lớp thành công.");
      }
      catch (ConflictException ex)
      {
        return ApiResponse<CancellationRequestDto>.Fail(ex.Message, ex.StatusCode);
      }
      catch (ValidationException ex)
      {
        return ApiResponse<CancellationRequestDto>.Fail(ex.Message, StatusCodes.Status400BadRequest);
      }
    }

    public async Task<ApiResponse<CancellationRequestDto>> ResolveAsync(long requestId, long adminUserId, ResolveCancellationRequestDto dto)
    {
      try
      {
        var request = await _cancellationRequestRepository.GetByIdWithDetailsAsync(requestId);
        if (request == null)
        {
          throw new NotFoundException("Cancellation request not found.", "CANCELLATION_REQUEST_NOT_FOUND");
        }

        if (request.Status != CancellationRequestStatus.Pending)
        {
          throw new ConflictException("Cancellation request has already been resolved.", "CANCELLATION_REQUEST_ALREADY_RESOLVED");
        }

        var adminUser = await _userRepository.GetByIdAsync(adminUserId);
        if (adminUser == null)
        {
          throw new NotFoundException("Admin user not found.", "USER_NOT_FOUND");
        }

        var classEntity = request.Class ?? throw new DataConsistencyException("Cancellation request class relationship was not loaded.");
        if (IsCancelledStatus(classEntity.Status))
        {
          throw new ConflictException("Class is already cancelled.", "CLASS_ALREADY_CANCELLED");
        }

        ApplyResolution(
          request,
          classEntity,
          adminUser,
          dto.RefundAmount,
          dto.RefundNote,
          dto.IsRefunded);

        await _cancellationRequestRepository.SaveChangesAsync();

        await NotifyCancellationResolvedAsync(request, classEntity);
        await NotifyClassCancelledAsync(request, classEntity);

        _logger.LogInformation(
          "CancellationRequest {RequestId} resolved by Admin {AdminUserId}",
          request.Id,
          adminUserId);

        return ApiResponse<CancellationRequestDto>.SuccessResult(
          CancellationRequestMapper.ToDto(request),
          "Đã xử lý yêu cầu hủy lớp thành công.");
      }
      catch (ConflictException ex)
      {
        return ApiResponse<CancellationRequestDto>.Fail(ex.Message, ex.StatusCode);
      }
      catch (ValidationException ex)
      {
        return ApiResponse<CancellationRequestDto>.Fail(ex.Message, StatusCodes.Status400BadRequest);
      }
    }

    public async Task<ApiResponse<PagedResult<CancellationRequestDto>>> GetAllForAdminAsync(CancellationRequestQueryParameters parameters)
    {
      var pagedRequests = await _cancellationRequestRepository.GetPagedWithDetailsAsync(parameters);
      var result = new PagedResult<CancellationRequestDto>
      {
        Items = pagedRequests.Items.Select(CancellationRequestMapper.ToDto).ToList(),
        TotalCount = pagedRequests.TotalCount,
        Page = pagedRequests.Page,
        PageSize = pagedRequests.PageSize,
        TotalPages = pagedRequests.TotalPages
      };

      return ApiResponse<PagedResult<CancellationRequestDto>>.SuccessResult(result);
    }

    public async Task<ApiResponse<PagedResult<CancellationRequestDto>>> GetMineAsync(long currentUserId, UserRole role, CancellationRequestQueryParameters parameters)
    {
      if (role is not (UserRole.Student or UserRole.Tutor))
      {
        throw new ForbiddenException("You cannot view cancellation requests with this role.", "CANCELLATION_REQUEST_FORBIDDEN");
      }

      var pagedRequests = await _cancellationRequestRepository.GetPagedForUserWithDetailsAsync(currentUserId, role, parameters);
      var result = new PagedResult<CancellationRequestDto>
      {
        Items = pagedRequests.Items.Select(CancellationRequestMapper.ToDto).ToList(),
        TotalCount = pagedRequests.TotalCount,
        Page = pagedRequests.Page,
        PageSize = pagedRequests.PageSize,
        TotalPages = pagedRequests.TotalPages
      };

      return ApiResponse<PagedResult<CancellationRequestDto>>.SuccessResult(result);
    }

    public async Task<ApiResponse<CancellationRequestDto>> GetByIdAsync(long id)
    {
      var request = await _cancellationRequestRepository.GetByIdWithDetailsAsync(id);
      if (request == null)
      {
        throw new NotFoundException("Cancellation request not found.", "CANCELLATION_REQUEST_NOT_FOUND");
      }

      return ApiResponse<CancellationRequestDto>.SuccessResult(CancellationRequestMapper.ToDto(request));
    }

    public async Task<ApiResponse<CancellationRequestDto>> GetLatestByClassIdAsync(long classId, long currentUserId, UserRole role)
    {
      var classEntity = await _classRepository.GetByIdWithDetailsAsync(classId);
      if (classEntity == null)
      {
        throw new NotFoundException("Class not found.", "CLASS_NOT_FOUND");
      }

      EnsureUserCanView(role, currentUserId, classEntity);

      var request = await _cancellationRequestRepository.GetLatestByClassIdWithDetailsAsync(classId);
      if (request == null)
      {
        return ApiResponse<CancellationRequestDto>.SuccessResult(null!);
      }

      return ApiResponse<CancellationRequestDto>.SuccessResult(CancellationRequestMapper.ToDto(request));
    }

    private static void EnsureUserCanCreate(UserRole role, long currentUserId, Class classEntity)
    {
      switch (role)
      {
        case UserRole.Student when classEntity.StudentId != currentUserId:
          throw new ForbiddenException("You cannot create a cancellation request for this class.", "CANCELLATION_REQUEST_CREATE_FORBIDDEN");
        case UserRole.Tutor when classEntity.Tutor?.UserId != currentUserId:
          throw new ForbiddenException("You cannot create a cancellation request for this class.", "CANCELLATION_REQUEST_CREATE_FORBIDDEN");
      }
    }

    private static void EnsureUserCanView(UserRole role, long currentUserId, Class classEntity)
    {
      switch (role)
      {
        case UserRole.Admin:
          return;
        case UserRole.Student when classEntity.StudentId == currentUserId:
          return;
        case UserRole.Tutor when classEntity.Tutor?.UserId == currentUserId:
          return;
        default:
          throw new ForbiddenException("You cannot view this cancellation request.", "CANCELLATION_REQUEST_FORBIDDEN");
      }
    }

    private static void EnsureClassCanCreate(UserRole role, Class classEntity)
    {
      if (IsCancelledStatus(classEntity.Status))
      {
        throw new ConflictException("Class is already cancelled.", "CLASS_ALREADY_CANCELLED");
      }

      if (classEntity.Status == ClassStatus.Completed)
      {
        throw new ConflictException("Class is already completed.", "CLASS_ALREADY_COMPLETED");
      }

      if (role == UserRole.Admin)
      {
        if (classEntity.Status is not (ClassStatus.PendingStart or ClassStatus.Active))
        {
          throw new ValidationException(
            "Admin can only cancel classes in PendingStart or Active status.",
            "CLASS_CANCELLATION_NOT_ALLOWED");
        }
      }
      else if (classEntity.Status != ClassStatus.PendingStart)
      {
        throw new ValidationException(
          "Only classes in PendingStart status can be cancelled by students or tutors.",
          "CLASS_CANCELLATION_NOT_ALLOWED");
      }
    }

    private static void ValidateReason(string reason)
    {
      if (string.IsNullOrWhiteSpace(reason))
      {
        throw new ValidationException("Reason is required.", "CANCELLATION_REASON_REQUIRED");
      }
    }

    private static bool HasRefundInput(CreateCancellationRequestDto dto)
    {
      return dto.RefundAmount.HasValue
        || !string.IsNullOrWhiteSpace(dto.RefundNote)
        || dto.IsRefunded.HasValue;
    }

    private static void ApplyResolution(
      CancellationRequest request,
      Class classEntity,
      User resolvedByUser,
      decimal? refundAmount,
      string? refundNote,
      bool isRefunded)
    {
      if (refundAmount.HasValue && refundAmount.Value < 0)
      {
        throw new ValidationException("Refund amount cannot be negative.", "INVALID_REFUND_AMOUNT");
      }

      if (isRefunded && !refundAmount.HasValue)
      {
        throw new ValidationException("Refund amount is required when marking the request as refunded.", "REFUND_AMOUNT_REQUIRED");
      }

      request.RefundAmount = refundAmount;
      request.RefundNote = string.IsNullOrWhiteSpace(refundNote) ? null : refundNote.Trim();
      request.IsRefunded = isRefunded;
      request.ResolvedAt = DateTime.UtcNow;
      request.ResolvedByUserId = resolvedByUser.Id;
      request.ResolvedByUser = resolvedByUser;
      request.Status = CancellationRequestStatus.Resolved;

      classEntity.Status = GetCancelledStatus(request.RequestedByRole);
    }

    private static ClassStatus GetCancelledStatus(UserRole role)
    {
      return role switch
      {
        UserRole.Student => ClassStatus.CancelledByStudent,
        UserRole.Tutor => ClassStatus.CancelledByTutor,
        _ => ClassStatus.CancelledByAdmin
      };
    }

    private static bool IsCancelledStatus(ClassStatus status)
    {
      return status is ClassStatus.CancelledByStudent
        or ClassStatus.CancelledByTutor
        or ClassStatus.CancelledByAdmin;
    }

    private async Task NotifyAdminsOfPendingRequestAsync(CancellationRequest request, Class classEntity)
    {
      var adminIds = await GetAdminUserIdsAsync();
      if (adminIds.Count == 0)
      {
        return;
      }

      var requesterName = request.RequestedByUser?.FullName ?? "Unknown user";

      await _notificationService.SendToMultipleAsync(
        adminIds,
        "Yêu cầu hủy lớp mới",
        $"{requesterName} đã gửi yêu cầu hủy lớp {classEntity.Code}.",
        NotificationType.CancellationRequestCreated,
        "CancellationRequest",
        request.Id,
        $"/admin/cancellation-requests/{request.Id}");
    }

    private async Task NotifyCancellationCreatedAsync(CancellationRequest request, Class classEntity)
    {
      await _notificationService.SendToMultipleAsync(
        GetClassParticipantUserIds(classEntity),
        "Yêu cầu hủy lớp đã được tạo",
        $"Quản trị viên đã tạo một yêu cầu hủy lớp cho lớp học {classEntity.Code}.",
        NotificationType.CancellationRequestCreated,
        "CancellationRequest",
        request.Id,
        $"/classes/{classEntity.Id}");
    }

    private async Task NotifyCancellationResolvedAsync(CancellationRequest request, Class classEntity)
    {
      var refundText = request.RefundAmount.HasValue
        ? $" Số tiền hoàn lại: {request.RefundAmount.Value:0.##}đ."
        : string.Empty;

      await _notificationService.SendToMultipleAsync(
        GetClassParticipantUserIds(classEntity),
        "Yêu cầu hủy lớp đã được xử lý",
        $"Yêu cầu hủy lớp {classEntity.Code} đã được xử lý.{refundText}",
        NotificationType.CancellationRequestResolved,
        "CancellationRequest",
        request.Id,
        $"/classes/{classEntity.Id}");
    }

    private async Task NotifyClassCancelledAsync(CancellationRequest request, Class classEntity)
    {
      var roleText = request.RequestedByRole switch
      {
        UserRole.Student => "Học viên",
        UserRole.Tutor => "Gia sư",
        UserRole.Admin => "Quản trị viên",
        _ => "Người dùng"
      };

      await _notificationService.SendToMultipleAsync(
        GetClassParticipantUserIds(classEntity),
        "Lớp học đã bị hủy",
        $"Lớp học {classEntity.Code} đã bị hủy bởi {roleText}.",
        NotificationType.ClassCancelled,
        "Class",
        classEntity.Id,
        $"/classes/{classEntity.Id}");
    }

    private async Task<List<long>> GetAdminUserIdsAsync()
    {
      var admins = await _userRepository.FindAsync(x => x.Role == UserRole.Admin);
      return admins
        .Select(x => x.Id)
        .Distinct()
        .ToList();
    }

    private static IEnumerable<long> GetClassParticipantUserIds(Class classEntity)
    {
      var tutorUserId = classEntity.Tutor?.UserId;
      if (!tutorUserId.HasValue)
      {
        throw new DataConsistencyException("Class tutor user relationship was not loaded.");
      }

      return new[] { classEntity.StudentId, tutorUserId.Value }
        .Distinct();
    }

    private async Task RejectPendingCompletionRequestsAsync(long classId)
    {
      var pendingRequests = await _classCompletionRequestRepository
        .FindAsync(r => r.ClassId == classId && r.Status == ClassCompletionRequestStatus.Pending);

      foreach (var request in pendingRequests)
      {
        request.Status = ClassCompletionRequestStatus.Rejected;
        request.RespondedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;
      }
    }
  }
}
