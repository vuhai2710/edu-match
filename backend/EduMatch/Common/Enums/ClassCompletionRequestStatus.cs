using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ClassCompletionRequestStatus
{
  [Display(Name = "Cho xac nhan")]
  Pending,

  [Display(Name = "Da xac nhan")]
  Confirmed,

  [Display(Name = "Tu choi")]
  Rejected
}
