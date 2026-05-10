using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum EducationLevel
  {
    Preschool = 0,
    PrimarySchool = 1,
    SecondarySchool = 2,
    HighSchool = 3,
    College = 4,
    University = 5
  }
}
