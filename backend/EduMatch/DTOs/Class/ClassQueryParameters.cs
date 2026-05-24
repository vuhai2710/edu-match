using EduMatch.Common.Enums;
using Microsoft.AspNetCore.Mvc;

namespace EduMatch.DTOs.Classes;

public class ClassQueryParameters : BaseQueryParameters
{
  [FromQuery(Name = "status")]
  public ClassStatus? Status { get; set; }
}
