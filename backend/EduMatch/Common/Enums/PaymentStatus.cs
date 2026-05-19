using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum PaymentStatus
  {
    [Display(Name = "Chờ thanh toán")]
    Pending,

    [Display(Name = "Thành công")]
    Success,

    [Display(Name = "Thất bại")]
    Failed,

    [Display(Name = "Đã hủy")]
    Cancelled
  }
}
