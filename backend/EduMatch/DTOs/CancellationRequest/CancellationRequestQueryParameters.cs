using EduMatch.Common.Enums;
using Microsoft.AspNetCore.Mvc;

namespace EduMatch.DTOs.CancellationRequests
{
  public class CancellationRequestQueryParameters : BaseQueryParameters
  {
    [FromQuery(Name = "status")]
    public CancellationRequestStatus? Status { get; set; }
  }
}
