namespace EduMatch.Domain.Booking.Scheduling;

public interface IBookingScheduleService
{
  IReadOnlyList<BookingTimeSlot> ParseAndValidate(string timeSlotsJson, decimal hoursPerSession);
  IReadOnlyList<BookingTimeSlot> Validate(IEnumerable<BookingTimeSlotInput>? timeSlots, decimal hoursPerSession);
  TimeOnly ComputeEndTime(TimeOnly startTime, decimal hoursPerSession);
  void ValidateHoursPerSession(decimal hoursPerSession, string fieldName = "HoursPerSession");
  bool HasOverlap(BookingTimeSlot first, BookingTimeSlot second);
  bool HasAnyOverlap(IEnumerable<BookingTimeSlot> timeSlots);
}
