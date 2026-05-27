using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.Domain.Booking.Scheduling;
using EduMatch.DTOs;
using EduMatch.DTOs.LearningRequests;
using EduMatch.Mappers;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;

namespace EduMatch.Services
{
  public class TutorLearningRequestService : ITutorLearningRequestService
  {
    private readonly ILearningRequestRepository _learningRequestRepository;
    private readonly IBookingScheduleService _bookingScheduleService;
    private readonly IBookingOrchestrator _bookingOrchestrator;
    private readonly INotificationService _notificationService;

    public TutorLearningRequestService(
      ILearningRequestRepository learningRequestRepository,
      IBookingScheduleService bookingScheduleService,
      IBookingOrchestrator bookingOrchestrator,
      INotificationService notificationService)
    {
      _learningRequestRepository = learningRequestRepository;
      _bookingScheduleService = bookingScheduleService;
      _bookingOrchestrator = bookingOrchestrator;
      _notificationService = notificationService;
    }

    public async Task<PagedResult<LearningRequestDto>> GetIncomingRequestsAsync(long tutorProfileId, LearningRequestQueryParameters parameters)
    {
      var pagedRequests = await _learningRequestRepository.GetByTutorIdAsync(tutorProfileId, parameters);

      return new PagedResult<LearningRequestDto>
      {
        Items = pagedRequests.Items
          .Select(request => LearningRequestMapper.ToDto(
            request,
            _bookingScheduleService.ParseAndValidate(request.TimeSlots, request.HoursPerSession)))
          .ToList(),
        TotalCount = pagedRequests.TotalCount,
        Page = pagedRequests.Page,
        PageSize = pagedRequests.PageSize,
        TotalPages = pagedRequests.TotalPages
      };
    }

    public async Task<ApiResponse<LearningRequestDto>> AcceptAsync(long id, long tutorProfileId)
    {
      try
      {
        var request = await GetOwnedRequestAsync(id, tutorProfileId);
        EnsurePendingStatus(request, "Khong the chap nhan yeu cau hoc tap o trang thai hien tai.");

        var requestedSlots = _bookingScheduleService.ParseAndValidate(request.TimeSlots, request.HoursPerSession);
        await _bookingOrchestrator.SoftBookAsync(request.Id, tutorProfileId, requestedSlots);
        request = await GetOwnedRequestAsync(id, tutorProfileId);
        requestedSlots = _bookingScheduleService.ParseAndValidate(request.TimeSlots, request.HoursPerSession);

        await _notificationService.SendAsync(
          request.StudentId,
          "Yeu cau hoc tap duoc chap nhan",
          $"Gia su {request.Tutor?.User?.FullName ?? string.Empty} da chap nhan yeu cau hoc {request.Subject?.Name ?? string.Empty} cua ban.",
          NotificationType.LearningRequestAccepted,
          "LearningRequest",
          request.Id,
          $"/learning-requests/{request.Id}");

        return ApiResponse<LearningRequestDto>.SuccessResult(
          LearningRequestMapper.ToDto(request, requestedSlots),
          "Chap nhan yeu cau hoc tap thanh cong.",
          200);
      }
      catch (ConflictException ex)
      {
        return ApiResponse<LearningRequestDto>.Fail(ex.Message, ex.StatusCode);
      }
    }

    public async Task<ApiResponse<LearningRequestDto>> RejectAsync(long id, long tutorProfileId)
    {
      try
      {
        var request = await GetOwnedRequestAsync(id, tutorProfileId);
        EnsurePendingStatus(request, "Khong the tu choi yeu cau hoc tap o trang thai hien tai.");

        request.Status = LearningRequestStatus.TutorRejected;

        _learningRequestRepository.Update(request);
        await _learningRequestRepository.SaveChangesAsync();

        var requestedSlots = _bookingScheduleService.ParseAndValidate(request.TimeSlots, request.HoursPerSession);

        await _notificationService.SendAsync(
          request.StudentId,
          "Yeu cau hoc tap bi tu choi",
          $"Gia su {request.Tutor?.User?.FullName ?? string.Empty} da tu choi yeu cau hoc {request.Subject?.Name ?? string.Empty} cua ban.",
          NotificationType.LearningRequestRejected,
          "LearningRequest",
          request.Id,
          $"/learning-requests/{request.Id}");

        return ApiResponse<LearningRequestDto>.SuccessResult(
          LearningRequestMapper.ToDto(request, requestedSlots),
          "Tu choi yeu cau hoc tap thanh cong.",
          200);
      }
      catch (ConflictException ex)
      {
        return ApiResponse<LearningRequestDto>.Fail(ex.Message, ex.StatusCode);
      }
    }

    private async Task<LearningRequest> GetOwnedRequestAsync(long id, long tutorProfileId)
    {
      var request = await _learningRequestRepository.GetByIdWithDetailsAsync(id);
      if (request == null)
      {
        throw new NotFoundException("Khong tim thay yeu cau hoc tap.", "LEARNING_REQUEST_NOT_FOUND");
      }

      if (request.TutorId != tutorProfileId)
      {
        throw new ForbiddenException("Ban khong co quyen thao tac yeu cau hoc tap nay.", "LEARNING_REQUEST_FORBIDDEN");
      }

      return request;
    }

    private static void EnsurePendingStatus(LearningRequest request, string message)
    {
      if (request.Status != LearningRequestStatus.Pending)
      {
        throw new ConflictException(message, "LEARNING_REQUEST_INVALID_STATUS");
      }
    }
  }
}
