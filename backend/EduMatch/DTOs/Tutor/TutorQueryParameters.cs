using Microsoft.AspNetCore.Mvc;

namespace EduMatch.DTOs.Tutor
{
  public class TutorQueryParameters : BaseQueryParameters
  {
    [FromQuery(Name = "subjectId")]
    public long? SubjectId { get; set; }

    [FromQuery(Name = "provinceId")]
    public int? ProvinceId { get; set; }

    [FromQuery(Name = "wardCode")]
    public string? WardCode { get; set; }
  }
}
