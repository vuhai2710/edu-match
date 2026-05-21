using EduMatch.Domain.Booking.Scheduling;

namespace EduMatch.Services.Interfaces
{
  public interface IBookingConflictService
  {
    Task CheckForConflictsAsync(
      long tutorProfileId,
      IReadOnlyList<BookingTimeSlot> requestedSlots,
      long? excludeLearningRequestId = null);
  }
}
