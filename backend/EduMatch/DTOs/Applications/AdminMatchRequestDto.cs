using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Applications
{
  public class AdminMatchRequestDto
  {
    [Required(ErrorMessage = "Mã gia sư không được để trống.")]
    public long TutorId { get; set; }

    [Required(ErrorMessage = "Số tiền cọc không được để trống.")]
    [Range(0, double.MaxValue, ErrorMessage = "Số tiền cọc phải lớn hơn hoặc bằng 0.")]
    public decimal DepositAmount { get; set; }
  }
}
