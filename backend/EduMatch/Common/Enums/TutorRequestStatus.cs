using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum TutorRequestStatus
  {
    Open = 0,
    Expired = 1,
    Assigned = 2,
    Closed = 3
  }
}
