using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum ClassStatus
  {
    [Display(Name = "Chờ thanh toán")]
    PendingPayment,

    [Display(Name = "Lớp đã được tạo")]
    Active,

    [Display(Name = "Hoàn thành")]
    Completed,

    [Display(Name = "Đã hủy")]
    Cancelled
  }
}
