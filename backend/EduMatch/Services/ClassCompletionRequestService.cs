using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.DTOs;
using EduMatch.DTOs.ClassCompletionRequests;
using EduMatch.Mappers;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;

namespace EduMatch.Services;

public class ClassCompletionRequestService : IClassCompletionRequestService
{
  private readonly IClassCompletionRequestRepository _classCompletionRequestRepository;
  private readonly IClassRepository _classRepository;
  private readonly IUserRepository _userRepository;
  private readonly INotificationService _notificationService;
  private readonly ILogger<ClassCompletionRequestService> _logger;

  public ClassCompletionRequestService(
    IClassCompletionRequestRepository classCompletionRequestRepository,
    IClassRepository classRepository,
    IUserRepository userRepository,
    INotificationService notificationService,
    ILogger<ClassCompletionRequestService> logger)
  {
    _classCompletionRequestRepository = classCompletionRequestRepository;
    _classRepository = classRepository;
    _userRepository = userRepository;
    _notificationService = notificationService;
    _logger = logger;
  }

  public async Task<ApiResponse<ClassCompletionRequestDto>> CreateAsync(long currentUserId, UserRole role, CreateClassCompletionRequestDto dto)
  {
    try
    {
      EnsureParticipantRole(role);

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

      EnsureUserCanManage(role, currentUserId, classEntity);
      EnsureClassCanCreate(classEntity);

      if (await _classCompletionRequestRepository.HasPendingRequestForClassAsync(dto.ClassId))
      {
        throw new ConflictException(
          "This class already has a pending completion request.",
          "CLASS_COMPLETION_REQUEST_ALREADY_PENDING");
      }

      var request = new ClassCompletionRequest
      {
        ClassId = classEntity.Id,
        Class = classEntity,
        RequestedByUserId = currentUserId,
        RequestedByUser = requester,
        RequestedByRole = role,
        Status = ClassCompletionRequestStatus.Pending
      };

      await _classCompletionRequestRepository.AddAsync(request);
      await _classCompletionRequestRepository.SaveChangesAsync();

      await NotifyCompletionRequestedAsync(request, classEntity);

      _logger.LogInformation(
        "ClassCompletionRequest {RequestId} created for Class {ClassId} by {Role} {UserId}",
        request.Id,
        classEntity.Id,
        role,
        currentUserId);

      return ApiResponse<ClassCompletionRequestDto>.SuccessResult(
        ClassCompletionRequestMapper.ToDto(request),
        "Class completion request created successfully.");
    }
    catch (ConflictException ex)
    {
      return ApiResponse<ClassCompletionRequestDto>.Fail(ex.Message, ex.StatusCode);
    }
    catch (ValidationException ex)
    {
      return ApiResponse<ClassCompletionRequestDto>.Fail(ex.Message, StatusCodes.Status400BadRequest);
    }
  }

  public async Task<ApiResponse<ClassCompletionRequestDto>> RespondAsync(long requestId, long currentUserId, UserRole role, RespondClassCompletionRequestDto dto)
  {
    try
    {
      EnsureParticipantRole(role);

      var request = await _classCompletionRequestRepository.GetByIdWithDetailsAsync(requestId);
      if (request == null)
      {
        throw new NotFoundException("Class completion request not found.", "CLASS_COMPLETION_REQUEST_NOT_FOUND");
      }

      if (request.Status != ClassCompletionRequestStatus.Pending)
      {
        throw new ConflictException(
          "Class completion request has already been resolved.",
          "CLASS_COMPLETION_REQUEST_ALREADY_RESOLVED");
      }

      var responder = await _userRepository.GetByIdAsync(currentUserId);
      if (responder == null)
      {
        throw new NotFoundException("User not found.", "USER_NOT_FOUND");
      }

      var classEntity = request.Class ?? throw new DataConsistencyException("Class completion request class relationship was not loaded.");

      EnsureUserCanManage(role, currentUserId, classEntity);
      EnsureUserCanRespond(request, currentUserId, role);
      EnsureClassCanRespond(classEntity);

      request.RespondedAt = DateTime.UtcNow;
      request.RespondedByUserId = responder.Id;
      request.RespondedByUser = responder;
      request.RespondedByRole = role;
      request.Status = dto.IsConfirmed
        ? ClassCompletionRequestStatus.Confirmed
        : ClassCompletionRequestStatus.Rejected;

      if (dto.IsConfirmed)
      {
        classEntity.Status = ClassStatus.Completed;
        classEntity.EndDate = DateTime.UtcNow;
      }

      await _classCompletionRequestRepository.SaveChangesAsync();

      if (dto.IsConfirmed)
      {
        await NotifyCompletionConfirmedAsync(request, classEntity);
        await NotifyClassCompletedAsync(classEntity);
      }
      else
      {
        await NotifyCompletionRejectedAsync(request, classEntity);
      }

      _logger.LogInformation(
        "ClassCompletionRequest {RequestId} responded by {Role} {UserId} with status {Status}",
        request.Id,
        role,
        currentUserId,
        request.Status);

      return ApiResponse<ClassCompletionRequestDto>.SuccessResult(
        ClassCompletionRequestMapper.ToDto(request),
        dto.IsConfirmed
          ? "Class completion request confirmed successfully."
          : "Class completion request rejected successfully.");
    }
    catch (ConflictException ex)
    {
      return ApiResponse<ClassCompletionRequestDto>.Fail(ex.Message, ex.StatusCode);
    }
    catch (ValidationException ex)
    {
      return ApiResponse<ClassCompletionRequestDto>.Fail(ex.Message, StatusCodes.Status400BadRequest);
    }
  }

  public async Task<ApiResponse<ClassCompletionRequestDto>> GetLatestByClassIdAsync(long classId, long currentUserId, UserRole role)
  {
    var classEntity = await _classRepository.GetByIdWithDetailsAsync(classId);
    if (classEntity == null)
    {
      throw new NotFoundException("Class not found.", "CLASS_NOT_FOUND");
    }

    EnsureUserCanView(role, currentUserId, classEntity);

    var request = await _classCompletionRequestRepository.GetLatestByClassIdWithDetailsAsync(classId);
    if (request == null)
    {
      return ApiResponse<ClassCompletionRequestDto>.SuccessResult(null!);
    }

    return ApiResponse<ClassCompletionRequestDto>.SuccessResult(ClassCompletionRequestMapper.ToDto(request));
  }

  private static void EnsureParticipantRole(UserRole role)
  {
    if (role is not (UserRole.Student or UserRole.Tutor))
    {
      throw new ForbiddenException(
        "Only students or tutors can use class completion requests.",
        "CLASS_COMPLETION_REQUEST_FORBIDDEN");
    }
  }

  private static void EnsureUserCanManage(UserRole role, long currentUserId, Class classEntity)
  {
    switch (role)
    {
      case UserRole.Student when classEntity.StudentId != currentUserId:
        throw new ForbiddenException(
          "You cannot manage completion requests for this class.",
          "CLASS_COMPLETION_REQUEST_FORBIDDEN");
      case UserRole.Tutor when classEntity.Tutor?.UserId != currentUserId:
        throw new ForbiddenException(
          "You cannot manage completion requests for this class.",
          "CLASS_COMPLETION_REQUEST_FORBIDDEN");
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
        throw new ForbiddenException(
          "You cannot view this class completion request.",
          "CLASS_COMPLETION_REQUEST_VIEW_FORBIDDEN");
    }
  }

  private static void EnsureUserCanRespond(ClassCompletionRequest request, long currentUserId, UserRole role)
  {
    if (request.RequestedByUserId == currentUserId || request.RequestedByRole == role)
    {
      throw new ForbiddenException(
        "The request creator cannot respond to this class completion request.",
        "CLASS_COMPLETION_REQUEST_RESPOND_FORBIDDEN");
    }
  }

  private static void EnsureClassCanCreate(Class classEntity)
  {
    if (classEntity.Status != ClassStatus.Active)
    {
      throw new ValidationException(
        "Only active classes can create completion requests.",
        "CLASS_COMPLETION_REQUEST_NOT_ALLOWED");
    }
  }

  private static void EnsureClassCanRespond(Class classEntity)
  {
    if (classEntity.Status == ClassStatus.Completed)
    {
      throw new ConflictException("Class is already completed.", "CLASS_ALREADY_COMPLETED");
    }

    if (IsCancelledStatus(classEntity.Status))
    {
      throw new ConflictException("Class is already cancelled.", "CLASS_ALREADY_CANCELLED");
    }

    if (classEntity.Status != ClassStatus.Active)
    {
      throw new ValidationException(
        "Only active classes can resolve completion requests.",
        "CLASS_COMPLETION_REQUEST_RESOLVE_NOT_ALLOWED");
    }
  }

  private static bool IsCancelledStatus(ClassStatus status)
  {
    return status is ClassStatus.CancelledByStudent
      or ClassStatus.CancelledByTutor
      or ClassStatus.CancelledByAdmin;
  }

  private async Task NotifyCompletionRequestedAsync(ClassCompletionRequest request, Class classEntity)
  {
    var requesterName = request.RequestedByUser?.FullName ?? "Unknown user";
    var recipientId = GetCounterpartyUserId(classEntity, request.RequestedByRole);

    await _notificationService.SendAsync(
      recipientId,
      "Yeu cau xac nhan hoan thanh lop",
      $"{requesterName} da danh dau lop {classEntity.Code} la da hoan thanh. Vui long xac nhan.",
      NotificationType.ClassCompletionRequested,
      "Class",
      classEntity.Id,
      $"/classes/{classEntity.Id}");
  }

  private async Task NotifyCompletionConfirmedAsync(ClassCompletionRequest request, Class classEntity)
  {
    var adminIds = await GetAdminUserIdsAsync();
    var recipientIds = adminIds
      .Append(request.RequestedByUserId)
      .Distinct();

    var responderName = request.RespondedByUser?.FullName ?? "Unknown user";

    await _notificationService.SendToMultipleAsync(
      recipientIds,
      "Yeu cau hoan thanh lop da duoc xac nhan",
      $"{responderName} da xac nhan hoan thanh lop {classEntity.Code}.",
      NotificationType.ClassCompletionConfirmed,
      "Class",
      classEntity.Id,
      $"/classes/{classEntity.Id}");
  }

  private async Task NotifyCompletionRejectedAsync(ClassCompletionRequest request, Class classEntity)
  {
    var adminIds = await GetAdminUserIdsAsync();
    var recipientIds = adminIds
      .Append(request.RequestedByUserId)
      .Distinct();

    var responderName = request.RespondedByUser?.FullName ?? "Unknown user";

    await _notificationService.SendToMultipleAsync(
      recipientIds,
      "Yeu cau hoan thanh lop bi tu choi",
      $"{responderName} cho biet lop {classEntity.Code} chua hoan thanh.",
      NotificationType.ClassCompletionRejected,
      "Class",
      classEntity.Id,
      $"/classes/{classEntity.Id}");
  }

  private async Task NotifyClassCompletedAsync(Class classEntity)
  {
    var adminIds = await GetAdminUserIdsAsync();
    var recipientIds = GetClassParticipantUserIds(classEntity)
      .Concat(adminIds)
      .Distinct();

    await _notificationService.SendToMultipleAsync(
      recipientIds,
      "Lop hoc da hoan thanh",
      $"Lop hoc {classEntity.Code} da duoc xac nhan hoan thanh.",
      NotificationType.ClassCompleted,
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

  private static long GetCounterpartyUserId(Class classEntity, UserRole requestedByRole)
  {
    return requestedByRole switch
    {
      UserRole.Student => classEntity.Tutor?.UserId
        ?? throw new DataConsistencyException("Class tutor user relationship was not loaded."),
      UserRole.Tutor => classEntity.StudentId,
      _ => throw new ValidationException("Only students or tutors can create completion requests.", "CLASS_COMPLETION_REQUEST_FORBIDDEN")
    };
  }
}
