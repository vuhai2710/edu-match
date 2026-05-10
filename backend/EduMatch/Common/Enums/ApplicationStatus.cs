using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum ApplicationStatus
  {
    Pending = 0,
    StudentConfirmed = 1,
    AdminApproved = 2,
    AdminRejected = 3,
    StudentRejected = 4,
    AdminMatched = 5,
    StudentAccepted = 6,
    TutorAccepted = 7,
    BothAccepted = 8
  }
}
