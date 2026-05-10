using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum ClassStatus
    {
        PendingPayment,
        Active,
        Completed,
        Cancelled
    }
}