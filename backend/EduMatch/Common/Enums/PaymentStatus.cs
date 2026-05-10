using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum PaymentStatus
  {
    Pending,
    Success,
    Failed,
    Cancelled
  }
}