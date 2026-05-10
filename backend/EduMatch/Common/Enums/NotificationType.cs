using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum NotificationType
  {
    ApplicationCreated,
    ApplicationApproved,
    ApplicationRejected,
    StudentConfirmed,
    StudentRejected,
    AdminMatched,
    MatchAccepted,
    TutorRequestCreated,
    NewMessage,
    PaymentCreated,
    PaymentSuccess,
    ReviewCreated,
    BecomeTutorRequest,
    TutorApproved,
    TutorRejected
  }
}