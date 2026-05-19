using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum TutorRequestStatus
  {
    [Display(Name = "Đang mở")]
    Open = 0,

    [Display(Name = "Hết hạn")]
    Expired = 1,

    [Display(Name = "Đã nhận lớp")]
    Assigned = 2,

    [Display(Name = "Đã đóng")]
    Closed = 3
  }
}
