using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum ClassStatus
  {
    [Display(Name = "Chờ bắt đầu")]
    PendingStart,

    [Display(Name = "Đang hoạt động")]
    Active,

    [Display(Name = "Học viên hủy")]
    CancelledByStudent,

    [Display(Name = "Admin hủy")]
    CancelledByAdmin,

    [Display(Name = "Gia sư hủy")]
    CancelledByTutor
  }
}
