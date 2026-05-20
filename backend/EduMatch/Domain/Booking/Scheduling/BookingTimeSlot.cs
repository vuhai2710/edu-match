namespace EduMatch.Domain.Booking.Scheduling;

internal sealed class BookingTimeSlot
{
  public BookingTimeSlot(DayOfWeek day, TimeOnly startTime, TimeOnly endTime)
  {
    Day = day;
    StartTime = startTime;
    EndTime = endTime;
  }

  public DayOfWeek Day { get; }
  public TimeOnly StartTime { get; }
  public TimeOnly EndTime { get; }
}
