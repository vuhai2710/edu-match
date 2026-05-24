using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.DepositPolicy;

public class UpsertDepositPolicyDto
{
  [Range(1, int.MaxValue, ErrorMessage = "DepositSessionCount phai lon hon 0.")]
  public int DepositSessionCount { get; set; }

  [Range(typeof(decimal), "0", "0.9999", ErrorMessage = "DiscountPercent phai nam trong khoang tu 0 den nho hon 1.")]
  public decimal DiscountPercent { get; set; }

  public DateTime? ActiveFrom { get; set; }
  public DateTime? ActiveTo { get; set; }
}
