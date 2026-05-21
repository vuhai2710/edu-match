using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.Domain.Booking.Scheduling;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;

namespace EduMatch.Services
{
  public class BookingConflictService : IBookingConflictService
  {
    private readonly ILearningRequestRepository _learningRequestRepository;
    private readonly IBookingScheduleService _bookingScheduleService;

    public BookingConflictService(
      ILearningRequestRepository learningRequestRepository,
      IBookingScheduleService bookingScheduleService)
    {
      _learningRequestRepository = learningRequestRepository;
      _bookingScheduleService = bookingScheduleService;
    }

    public async Task CheckForConflictsAsync(
      long tutorProfileId,
      IReadOnlyList<BookingTimeSlot> requestedSlots,
      long? excludeLearningRequestId = null)
    {
      var now = DateTime.UtcNow;
      var softBookedRequests = await _learningRequestRepository.FindAsync(x =>
        x.TutorProfileId == tutorProfileId
        && x.Status == LearningRequestStatus.SoftBooked
        && x.PaymentExpiresAt.HasValue
        && x.PaymentExpiresAt > now
        && (!excludeLearningRequestId.HasValue || x.Id != excludeLearningRequestId.Value));

      foreach (var softBookedRequest in softBookedRequests)
      {
        var existingSlots = _bookingScheduleService.ParseAndValidate(
          softBookedRequest.TimeSlots,
          softBookedRequest.HoursPerSession);

        if (HasOverlap(requestedSlots, existingSlots))
        {
          throw new ConflictException(
            "Lịch học đề xuất bị trùng với một yêu cầu học tập SoftBooked khác của gia sư.",
            "LEARNING_REQUEST_SCHEDULE_CONFLICT");
        }
      }

      // TODO: add Class conflict source when Class schema is upgraded with TimeSlotsJson and v2 statuses.
    }

    private bool HasOverlap(IEnumerable<BookingTimeSlot> requestedSlots, IEnumerable<BookingTimeSlot> existingSlots)
    {
      foreach (var requestedSlot in requestedSlots)
      {
        foreach (var existingSlot in existingSlots)
        {
          if (_bookingScheduleService.HasOverlap(requestedSlot, existingSlot))
          {
            return true;
          }
        }
      }

      return false;
    }
  }
}
