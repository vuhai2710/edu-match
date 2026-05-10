using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum Level
  {
    Beginner = 0,
    Medium = 1,
    Advanced = 2
  }
}
