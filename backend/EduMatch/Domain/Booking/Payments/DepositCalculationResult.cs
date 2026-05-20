namespace EduMatch.Domain.Booking.Payments;

internal sealed class DepositCalculationResult
{
  public DepositCalculationResult(decimal totalAmount, decimal depositAmount)
  {
    TotalAmount = totalAmount;
    DepositAmount = depositAmount;
    RemainingAmount = totalAmount - depositAmount;
  }

  public decimal TotalAmount { get; }
  public decimal DepositAmount { get; }
  public decimal RemainingAmount { get; }
}
