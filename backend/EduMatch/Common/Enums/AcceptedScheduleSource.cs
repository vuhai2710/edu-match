using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum AcceptedScheduleSource
  {
    R1,
    R2
  }
}
