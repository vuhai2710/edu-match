using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ClassCompletionRequestStatus
{
  [Display(Name = "Chờ xác nhận")]
  Pending,

  [Display(Name = "Đã xác nhận")]
  Confirmed,

  [Display(Name = "Từ chối")]
  Rejected,

  [Display(Name = "Tự động xác nhận")]
  AutoConfirmed
}
