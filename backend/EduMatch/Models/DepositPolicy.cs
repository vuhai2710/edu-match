namespace EduMatch.Models;

public class DepositPolicy : BaseEntity
{
  public int DepositSessionCount { get; set; }
  public decimal DiscountPercent { get; set; }
  public DateTime? ActiveFrom { get; set; }
  public DateTime? ActiveTo { get; set; }
}
