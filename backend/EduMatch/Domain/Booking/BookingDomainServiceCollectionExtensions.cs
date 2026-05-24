using EduMatch.Domain.Booking.Payments;
using EduMatch.Domain.Booking.Scheduling;

namespace EduMatch.Domain.Booking;

internal static class BookingDomainServiceCollectionExtensions
{
  public static IServiceCollection AddBookingDomainServices(this IServiceCollection services)
  {
    services.AddSingleton<IBookingScheduleService, BookingScheduleService>();
    services.AddSingleton<IDepositCalculator, DefaultDepositCalculator>();

    return services;
  }
}
