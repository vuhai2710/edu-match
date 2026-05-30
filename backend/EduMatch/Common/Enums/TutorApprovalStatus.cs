using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum TutorApprovalStatus
  {
    [Display(Name = "Chờ duyệt")]
    Pending = 0,

    [Display(Name = "Đã duyệt")]
    Approved = 1,

    [Display(Name = "Từ chối")]
    Rejected = 2
  }
}
