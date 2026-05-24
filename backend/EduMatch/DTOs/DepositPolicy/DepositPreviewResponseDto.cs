namespace EduMatch.DTOs.DepositPolicy;

public class DepositPreviewResponseDto
{
  public int DepositSessionCount { get; set; }
  public decimal DiscountPercent { get; set; }
  public decimal TotalAmount { get; set; }
  public decimal DepositAmount { get; set; }
  public decimal RemainingAmount { get; set; }
}
