using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Payment
{
  public class CreateDepositPaymentRequest
  {
    [Required(ErrorMessage = "Mã yêu cầu học không được để trống.")]
    public long LearningRequestId { get; set; }
  }
}
