using Microsoft.AspNetCore.Mvc;

namespace EduMatch.DTOs.Subject
{
  public class TutorBySubjectQueryParameters : BaseQueryParameters
  {
    [FromQuery(Name = "provinceId")]
    public int? ProvinceId { get; set; }

    [FromQuery(Name = "wardCode")]
    public string? WardCode { get; set; }

    [FromQuery(Name = "minRating")]
    public double? MinRating { get; set; }

    [FromQuery(Name = "maxHourlyRate")]
    public decimal? MaxHourlyRate { get; set; }
  }
}
