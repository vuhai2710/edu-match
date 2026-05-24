using EduMatch.Common.Enums;
using Microsoft.AspNetCore.Mvc;

namespace EduMatch.DTOs.LearningRequests
{
  public class LearningRequestQueryParameters : BaseQueryParameters
  {
    [FromQuery(Name = "status")]
    public LearningRequestStatus? Status { get; set; }
  }
}
