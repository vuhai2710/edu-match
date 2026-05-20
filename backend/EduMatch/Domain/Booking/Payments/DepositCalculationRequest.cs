namespace EduMatch.Domain.Booking.Payments;

internal sealed class DepositCalculationRequest
{
  public decimal TotalAmount { get; init; }
  public decimal? FixedAmount { get; init; }
  public decimal? PercentageRate { get; init; }
}
