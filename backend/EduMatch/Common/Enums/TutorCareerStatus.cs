using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum TutorCareerStatus
  {
    [Display(Name = "Sinh viên")]
    Student = 0,

    [Display(Name = "Đã tốt nghiệp")]
    Graduated = 1,

    [Display(Name = "Giáo viên")]
    Teacher = 2
  }
}
