using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum LearningRequestStatus
  {
    [Display(Name = "Chờ gia sư phản hồi")]
    Pending = 0,

    [Display(Name = "Đang thương lượng")]
    Negotiating = 1,

    [Display(Name = "Trùng lịch dạy")]
    SoftBooked = 2,

    [Display(Name = "Gia sư từ chối")]
    TutorRejected = 3,

    [Display(Name = "Học viên từ chối")]
    StudentRejected = 4,

    [Display(Name = "Yêu cầu đã hết hạn")]
    ScheduleExpired = 5,

    [Display(Name = "Hết hạn thanh toán")]
    PaymentExpired = 6,

    [Display(Name = "Lớp đã được tạo")]
    ConvertedToClass = 7
  }
}
