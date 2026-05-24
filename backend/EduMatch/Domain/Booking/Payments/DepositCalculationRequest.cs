namespace EduMatch.Domain.Booking.Payments;

public sealed class DepositCalculationRequest
{
  public decimal TotalAmount { get; init; }
  public decimal? FixedAmount { get; init; }
  public decimal? PercentageRate { get; init; }
}
