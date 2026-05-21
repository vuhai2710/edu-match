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
      var pagedRequests = await _learningRequestRepository.GetByTutorProfileIdAsync(tutorProfileId, parameters);

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

    public async Task<LearningRequestDto> AcceptAsync(long id, long tutorProfileId)
    {
      var request = await GetOwnedRequestAsync(id, tutorProfileId);
      EnsurePendingStatus(request, "Không thể chấp nhận yêu cầu học tập ở trạng thái hiện tại.");

      var requestedSlots = _bookingScheduleService.ParseAndValidate(request.TimeSlots, request.HoursPerSession);
      await _bookingOrchestrator.SoftBookAsync(request.Id, tutorProfileId, requestedSlots);
      request = await GetOwnedRequestAsync(id, tutorProfileId);
      requestedSlots = _bookingScheduleService.ParseAndValidate(request.TimeSlots, request.HoursPerSession);

      await _notificationService.SendAsync(
        request.StudentId,
        "Yêu cầu học tập được chấp nhận",
        $"Gia sư {request.TutorProfile?.User?.FullName ?? string.Empty} đã chấp nhận yêu cầu học {request.Subject?.Name ?? string.Empty} của bạn.",
        NotificationType.LearningRequestAccepted,
        "LearningRequest",
        request.Id,
        $"/learning-requests/{request.Id}");

      return LearningRequestMapper.ToDto(request, requestedSlots);
    }

    public async Task<LearningRequestDto> RejectAsync(long id, long tutorProfileId)
    {
      var request = await GetOwnedRequestAsync(id, tutorProfileId);
      EnsurePendingStatus(request, "Không thể từ chối yêu cầu học tập ở trạng thái hiện tại.");

      request.Status = LearningRequestStatus.TutorRejected;

      _learningRequestRepository.Update(request);
      await _learningRequestRepository.SaveChangesAsync();

      var requestedSlots = _bookingScheduleService.ParseAndValidate(request.TimeSlots, request.HoursPerSession);

      await _notificationService.SendAsync(
        request.StudentId,
        "Yêu cầu học tập bị từ chối",
        $"Gia sư {request.TutorProfile?.User?.FullName ?? string.Empty} đã từ chối yêu cầu học {request.Subject?.Name ?? string.Empty} của bạn.",
        NotificationType.LearningRequestRejected,
        "LearningRequest",
        request.Id,
        $"/learning-requests/{request.Id}");

      return LearningRequestMapper.ToDto(request, requestedSlots);
    }

    private async Task<LearningRequest> GetOwnedRequestAsync(long id, long tutorProfileId)
    {
      var request = await _learningRequestRepository.GetByIdWithDetailsAsync(id);
      if (request == null)
      {
        throw new NotFoundException("Không tìm thấy yêu cầu học tập.", "LEARNING_REQUEST_NOT_FOUND");
      }

      if (request.TutorProfileId != tutorProfileId)
      {
        throw new ForbiddenException("Bạn không có quyền thao tác yêu cầu học tập này.", "LEARNING_REQUEST_FORBIDDEN");
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
