using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum UserRole
  {
    Student = 0,
    Tutor = 1,
    Admin = 2
  }
}
