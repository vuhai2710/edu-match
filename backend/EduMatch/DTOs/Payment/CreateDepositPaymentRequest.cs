using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Payment
{
  public class CreateDepositPaymentRequest
  {
    [Required]
    public long LearningRequestId { get; set; }
  }
}
