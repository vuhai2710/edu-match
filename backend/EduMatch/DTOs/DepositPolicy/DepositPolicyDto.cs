namespace EduMatch.DTOs.DepositPolicy;

public class DepositPolicyDto
{
  public long Id { get; set; }
  public int DepositSessionCount { get; set; }
  public decimal DiscountPercent { get; set; }
  public DateTime? ActiveFrom { get; set; }
  public DateTime? ActiveTo { get; set; }
  public DateTime CreatedAt { get; set; }
  public DateTime? UpdatedAt { get; set; }
}
