namespace EduMatch.Domain.Booking.Payments;

internal interface IDepositCalculator
{
  DepositCalculationResult Calculate(DepositCalculationRequest request);
}
