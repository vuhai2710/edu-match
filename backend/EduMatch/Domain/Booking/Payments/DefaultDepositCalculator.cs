using EduMatch.Common.Exception;

namespace EduMatch.Domain.Booking.Payments;

internal sealed class DefaultDepositCalculator : IDepositCalculator
{
  public DepositCalculationResult Calculate(DepositCalculationRequest request)
  {
    var errors = new Dictionary<string, string[]>();

    if (request.TotalAmount <= 0)
    {
      errors[nameof(request.TotalAmount)] = ["TotalAmount phải lớn hơn 0."];
    }

    var hasFixedAmount = request.FixedAmount.HasValue;
    var hasPercentageRate = request.PercentageRate.HasValue;

    if (hasFixedAmount == hasPercentageRate)
    {
      errors["DepositPolicy"] =
      [
        "Phải cung cấp đúng một trong hai giá trị FixedAmount hoặc PercentageRate."
      ];
    }

    if (hasFixedAmount && request.FixedAmount <= 0)
    {
      errors[nameof(request.FixedAmount)] = ["FixedAmount phải lớn hơn 0."];
    }

    if (hasFixedAmount && request.FixedAmount > request.TotalAmount)
    {
      errors[nameof(request.FixedAmount)] = ["FixedAmount không được lớn hơn TotalAmount."];
    }

    if (hasPercentageRate && (request.PercentageRate <= 0 || request.PercentageRate > 1))
    {
      errors[nameof(request.PercentageRate)] =
      [
        "PercentageRate phải nằm trong khoảng (0, 1]. Ví dụ: 0.3 tương ứng 30%."
      ];
    }

    if (errors.Count > 0)
    {
      throw new ValidationException(errors, "INVALID_DEPOSIT_POLICY");
    }

    var rawDepositAmount = request.FixedAmount
      ?? request.TotalAmount * request.PercentageRate!.Value;

    var depositAmount = decimal.Round(rawDepositAmount, 2, MidpointRounding.AwayFromZero);

    if (depositAmount <= 0 || depositAmount > request.TotalAmount)
    {
      throw new ValidationException(
        "Số tiền đặt cọc sau khi tính toán không hợp lệ.",
        "INVALID_DEPOSIT_AMOUNT");
    }

    return new DepositCalculationResult(request.TotalAmount, depositAmount);
  }
}
