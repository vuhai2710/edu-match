using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum Grade
  {
    [Display(Name = "Lớp 1")]
    Grade1 = 1,

    [Display(Name = "Lớp 2")]
    Grade2 = 2,

    [Display(Name = "Lớp 3")]
    Grade3 = 3,

    [Display(Name = "Lớp 4")]
    Grade4 = 4,

    [Display(Name = "Lớp 5")]
    Grade5 = 5,

    [Display(Name = "Lớp 6")]
    Grade6 = 6,

    [Display(Name = "Lớp 7")]
    Grade7 = 7,

    [Display(Name = "Lớp 8")]
    Grade8 = 8,

    [Display(Name = "Lớp 9")]
    Grade9 = 9,

    [Display(Name = "Lớp 10")]
    Grade10 = 10,

    [Display(Name = "Lớp 11")]
    Grade11 = 11,

    [Display(Name = "Lớp 12")]
    Grade12 = 12,

    [Display(Name = "Đại học")]
    University = 13,

    [Display(Name = "Khác")]
    Other = 14
  }
}
