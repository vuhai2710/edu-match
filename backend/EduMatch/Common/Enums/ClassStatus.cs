using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ClassStatus
{
  [Display(Name = "Cho bat dau")]
  PendingStart,

  [Display(Name = "Dang hoat dong")]
  Active,

  [Display(Name = "Da hoan thanh")]
  Completed,

  [Display(Name = "Hoc vien huy")]
  CancelledByStudent,

  [Display(Name = "Admin huy")]
  CancelledByAdmin,

  [Display(Name = "Gia su huy")]
  CancelledByTutor
}
