using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.Data;
using EduMatch.Domain.Booking.Scheduling;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Services
{
  public class BookingConflictService : IBookingConflictService
  {
    private readonly ILearningRequestRepository _learningRequestRepository;
    private readonly IBookingScheduleService _bookingScheduleService;
    private readonly AppDbContext _dbContext;

    public BookingConflictService(
      ILearningRequestRepository learningRequestRepository,
      IBookingScheduleService bookingScheduleService,
      AppDbContext dbContext)
    {
      _learningRequestRepository = learningRequestRepository;
      _bookingScheduleService = bookingScheduleService;
      _dbContext = dbContext;
    }

    public async Task CheckForConflictsAsync(
      long tutorProfileId,
      IReadOnlyList<BookingTimeSlot> requestedSlots,
      long? excludeLearningRequestId = null)
    {
      var now = DateTime.UtcNow;
      var softBookedRequests = await _learningRequestRepository.FindAsync(x =>
        x.TutorId == tutorProfileId
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

      // Check conflict with active or pending classes of the tutor
      var activeClasses = await _dbContext.Classes
        .Include(c => c.LearningRequest)
        .Where(c => c.TutorId == tutorProfileId
          && (c.Status == ClassStatus.PendingStart || c.Status == ClassStatus.Active))
        .ToListAsync();

      foreach (var activeClass in activeClasses)
      {
        if (string.IsNullOrWhiteSpace(activeClass.TimeSlotsJson))
          continue;

        decimal hoursPerSession = 2.0m;
        if (activeClass.LearningRequest != null)
        {
          hoursPerSession = activeClass.LearningRequest.HoursPerSession;
        }
        else
        {
          var parsed = false;
          foreach (var candidate in new decimal[] { 0.5m, 1m, 1.5m, 2m, 2.5m, 3m })
          {
            try
            {
              var slots = _bookingScheduleService.ParseAndValidate(activeClass.TimeSlotsJson, candidate);
              if (HasOverlap(requestedSlots, slots))
              {
                throw new ConflictException(
                  "Lịch học đề xuất bị trùng với lịch dạy của lớp học đang hoạt động hoặc chuẩn bị bắt đầu.",
                  "CLASS_SCHEDULE_CONFLICT");
              }
              parsed = true;
              break;
            }
            catch (ValidationException)
            {
              // try next candidate
            }
          }
          if (parsed) continue;
        }

        try
        {
          var existingSlots = _bookingScheduleService.ParseAndValidate(activeClass.TimeSlotsJson, hoursPerSession);
          if (HasOverlap(requestedSlots, existingSlots))
          {
            throw new ConflictException(
              "Lịch học đề xuất bị trùng với lịch dạy của lớp học đang hoạt động hoặc chuẩn bị bắt đầu.",
              "CLASS_SCHEDULE_CONFLICT");
          }
        }
        catch (ValidationException)
        {
          // ignore invalid JSON format in db if any
        }
      }
    }

    public async Task CheckForStudentConflictsAsync(
      long studentUserId,
      IReadOnlyList<BookingTimeSlot> requestedSlots,
      long? excludeLearningRequestId = null)
    {
      var now = DateTime.UtcNow;
      var softBookedRequests = await _learningRequestRepository.FindAsync(x =>
        x.StudentId == studentUserId
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
            "Lịch học đề xuất bị trùng với một yêu cầu học tập SoftBooked khác của bạn đang chờ thanh toán.",
            "STUDENT_SCHEDULE_CONFLICT");
        }
      }

      var activeClasses = await _dbContext.Classes
        .Include(c => c.LearningRequest)
        .Where(c => c.StudentId == studentUserId
          && (c.Status == ClassStatus.PendingStart || c.Status == ClassStatus.Active))
        .ToListAsync();

      foreach (var activeClass in activeClasses)
      {
        if (string.IsNullOrWhiteSpace(activeClass.TimeSlotsJson))
          continue;

        decimal hoursPerSession = 2.0m;
        if (activeClass.LearningRequest != null)
        {
          hoursPerSession = activeClass.LearningRequest.HoursPerSession;
        }
        else
        {
          var parsed = false;
          foreach (var candidate in new decimal[] { 0.5m, 1m, 1.5m, 2m, 2.5m, 3m })
          {
            try
            {
              var slots = _bookingScheduleService.ParseAndValidate(activeClass.TimeSlotsJson, candidate);
              if (HasOverlap(requestedSlots, slots))
              {
                throw new ConflictException(
                  "Lịch học đề xuất bị trùng với lịch học lớp khác của bạn đang hoạt động hoặc chuẩn bị bắt đầu.",
                  "STUDENT_CLASS_SCHEDULE_CONFLICT");
              }
              parsed = true;
              break;
            }
            catch (ValidationException)
            {
              // try next candidate
            }
          }
          if (parsed) continue;
        }

        try
        {
          var existingSlots = _bookingScheduleService.ParseAndValidate(activeClass.TimeSlotsJson, hoursPerSession);
          if (HasOverlap(requestedSlots, existingSlots))
          {
            throw new ConflictException(
              "Lịch học đề xuất bị trùng với lịch học lớp khác của bạn đang hoạt động hoặc chuẩn bị bắt đầu.",
              "STUDENT_CLASS_SCHEDULE_CONFLICT");
          }
        }
        catch (ValidationException)
        {
          // ignore invalid JSON format in db if any
        }
      }
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
