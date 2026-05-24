using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum Gender
  {
    [Display(Name = "Nam")]
    Male = 0,

    [Display(Name = "Nữ")]
    Female = 1
  }
}
