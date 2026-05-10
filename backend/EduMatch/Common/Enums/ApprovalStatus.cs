using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum ApprovalStatus
  {
    Pending = 0,
    Approved = 1,
    Rejected = 2
  }
}
