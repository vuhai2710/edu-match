using EduMatch.Common.Enums;
using Microsoft.AspNetCore.Mvc;

namespace EduMatch.DTOs.Classes;

public class ClassQueryParameters : BaseQueryParameters
{
  [FromQuery(Name = "status")]
  public ClassStatus? Status { get; set; }

  [FromQuery(Name = "subjectId")]
  public long? SubjectId { get; set; }

  [FromQuery(Name = "dayOfWeek")]
  public DayOfWeek? DayOfWeek { get; set; }
}
