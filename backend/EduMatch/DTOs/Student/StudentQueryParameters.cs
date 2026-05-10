using Microsoft.AspNetCore.Mvc;

namespace EduMatch.DTOs.StudentProfile
{
  public class StudentQueryParameters : BaseQueryParameters
  {
    [FromQuery(Name = "provinceId")]
    public int? ProvinceId { get; set; }

    [FromQuery(Name = "wardCode")]
    public string? WardCode { get; set; }
  }
}
