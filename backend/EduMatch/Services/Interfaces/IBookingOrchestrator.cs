using EduMatch.Domain.Booking.Scheduling;

namespace EduMatch.Services.Interfaces
{
  public interface IBookingOrchestrator
  {
    Task SoftBookAsync(
      long learningRequestId,
      long tutorProfileId,
      IReadOnlyList<BookingTimeSlot> slots,
      long? scheduleProposalId = null);
  }
}
