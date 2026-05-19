using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum EducationLevel
  {
    [Display(Name = "Mầm non")]
    Preschool = 0,

    [Display(Name = "Tiểu học")]
    PrimarySchool = 1,

    [Display(Name = "Trung học cơ sở")]
    SecondarySchool = 2,

    [Display(Name = "Trung học phổ thông")]
    HighSchool = 3,

    [Display(Name = "Cao đẳng")]
    College = 4,

    [Display(Name = "Đại học")]
    University = 5
  }
}
