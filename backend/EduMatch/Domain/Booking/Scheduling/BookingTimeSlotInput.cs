namespace EduMatch.Domain.Booking.Scheduling;

public sealed class BookingTimeSlotInput
{
  public string? Day { get; init; }
  public string? StartTime { get; init; }
  public string? EndTime { get; init; }
}
