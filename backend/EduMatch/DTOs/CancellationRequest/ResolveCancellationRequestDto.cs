using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.CancellationRequests
{
  public class ResolveCancellationRequestDto
  {
    [Range(typeof(decimal), "0", "79228162514264337593543950335")]
    public decimal? RefundAmount { get; set; }

    [MaxLength(1000)]
    public string? RefundNote { get; set; }

    public bool IsRefunded { get; set; }
  }
}
