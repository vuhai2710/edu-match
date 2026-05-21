using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum ScheduleProposalStatus
  {
    [Display(Name = "Chờ học viên phản hồi")]
    Pending = 0,

    [Display(Name = "Học viên đã chấp nhận")]
    Accepted = 1,

    [Display(Name = "Học viên đã từ chối")]
    Rejected = 2
  }
}
