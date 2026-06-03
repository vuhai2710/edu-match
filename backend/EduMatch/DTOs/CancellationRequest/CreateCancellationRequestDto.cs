using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.CancellationRequests
{
  public class CreateCancellationRequestDto
  {
    [Required(ErrorMessage = "Mã lớp học không được để trống.")]
    public long ClassId { get; set; }

    [Required(ErrorMessage = "Lý do hủy không được để trống.")]
    [MaxLength(1000, ErrorMessage = "Lý do hủy không được vượt quá 1000 ký tự.")]
    public string Reason { get; set; } = string.Empty;

    [Range(typeof(decimal), "0", "79228162514264337593543950335", ErrorMessage = "Số tiền hoàn trả phải lớn hơn hoặc bằng 0.")]
    public decimal? RefundAmount { get; set; }

    [MaxLength(1000, ErrorMessage = "Ghi chú hoàn tiền không được vượt quá 1000 ký tự.")]
    public string? RefundNote { get; set; }

    public bool? IsRefunded { get; set; }
  }
}
