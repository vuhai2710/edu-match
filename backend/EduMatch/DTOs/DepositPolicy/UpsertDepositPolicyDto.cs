using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.DepositPolicy;

public class UpsertDepositPolicyDto
{
  [Range(1, 10, ErrorMessage = "Số buổi cọc phải từ 1 đến 10 buổi.")]
  public int DepositSessionCount { get; set; }

  [Range(typeof(decimal), "0", "1", ErrorMessage = "DiscountPercent phải nằm trong khoảng từ 0 đến 1.")]
  public decimal DiscountPercent { get; set; }

  public DateTime? ActiveFrom { get; set; }
  public DateTime? ActiveTo { get; set; }
}
