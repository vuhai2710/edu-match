using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum NotificationType
  {
    [Display(Name = "Đơn ứng tuyển mới")]
    ApplicationCreated,

    [Display(Name = "Đơn ứng tuyển được duyệt")]
    ApplicationApproved,

    [Display(Name = "Đơn ứng tuyển bị từ chối")]
    ApplicationRejected,

    [Display(Name = "Học viên đã xác nhận")]
    StudentConfirmed,

    [Display(Name = "Học viên đã từ chối")]
    StudentRejected,

    [Display(Name = "Admin đã ghép lớp")]
    AdminMatched,

    [Display(Name = "Ghép lớp được chấp nhận")]
    MatchAccepted,

    [Display(Name = "Yêu cầu tìm gia sư mới")]
    TutorRequestCreated,

    [Display(Name = "Tin nhắn mới")]
    NewMessage,

    [Display(Name = "Thanh toán mới")]
    PaymentCreated,

    [Display(Name = "Thanh toán thành công")]
    PaymentSuccess,

    [Display(Name = "Đánh giá mới")]
    ReviewCreated,

    [Display(Name = "Yêu cầu trở thành gia sư")]
    BecomeTutorRequest,

    [Display(Name = "Gia sư được duyệt")]
    TutorApproved,

    [Display(Name = "Gia sư bị từ chối")]
    TutorRejected,

    [Display(Name = "Yêu cầu học tập đã được tạo")]
    LearningRequestCreated,

    [Display(Name = "Gia sư chấp nhận yêu cầu")]
    LearningRequestAccepted,

    [Display(Name = "Gia sư từ chối yêu cầu")]
    LearningRequestRejected,

    [Display(Name = "Gia sư đã đề xuất lịch học mới")]
    ScheduleProposalCreated,

    [Display(Name = "Học viên đã chấp nhận đề xuất lịch học")]
    ScheduleProposalAccepted,

    [Display(Name = "Học viên đã từ chối đề xuất lịch học")]
    ScheduleProposalRejected
  }
}
