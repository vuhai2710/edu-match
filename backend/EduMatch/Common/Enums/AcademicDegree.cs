using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum AcademicDegree
  {
    [Display(Name = "Trung cấp")]
    Intermediate = 0,

    [Display(Name = "Cao đẳng")]
    College = 1,

    [Display(Name = "Đại học")]
    University = 2
  }
}
