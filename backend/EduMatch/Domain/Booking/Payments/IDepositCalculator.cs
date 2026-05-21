namespace EduMatch.Domain.Booking.Payments;

public interface IDepositCalculator
{
  DepositCalculationResult Calculate(DepositCalculationRequest request);
}
