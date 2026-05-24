using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums
{
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum CancellationRequestStatus
  {
    [Display(Name = "Pending")]
    Pending,

    [Display(Name = "Resolved")]
    Resolved
  }
}
