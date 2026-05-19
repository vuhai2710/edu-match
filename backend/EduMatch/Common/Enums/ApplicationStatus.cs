using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum ApplicationStatus
  {
    [Display(Name = "Chờ xử lý")]
    Pending = 0,

    [Display(Name = "Học viên đã xác nhận")]
    StudentConfirmed = 1,

    [Display(Name = "Admin đã duyệt")]
    AdminApproved = 2,

    [Display(Name = "Admin đã từ chối")]
    AdminRejected = 3,

    [Display(Name = "Học viên đã từ chối")]
    StudentRejected = 4,

    [Display(Name = "Admin đã ghép")]
    AdminMatched = 5,

    [Display(Name = "Học viên đã chấp nhận")]
    StudentAccepted = 6,

    [Display(Name = "Gia sư đã chấp nhận")]
    TutorAccepted = 7,

    [Display(Name = "Hai bên đã chấp nhận")]
    BothAccepted = 8
  }
}
