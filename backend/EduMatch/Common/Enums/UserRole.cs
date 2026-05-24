using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum UserRole
  {
    [Display(Name = "Học viên")]
    Student = 0,

    [Display(Name = "Gia sư")]
    Tutor = 1,

    [Display(Name = "Quản trị viên")]
    Admin = 2
  }
}
