using Microsoft.AspNetCore.Mvc;

namespace EduMatch.DTOs.Notification
{
  public class NotificationQueryParameters : BaseQueryParameters
  {
    [FromQuery(Name = "isRead")]
    public bool? IsRead { get; set; }
  }
}
