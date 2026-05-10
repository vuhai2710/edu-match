using EduMatch.Common.Enums;
using Microsoft.AspNetCore.Mvc;

namespace EduMatch.DTOs.TutorRequests
{
  public class TutorRequestFilterDto
  {
    [FromQuery(Name = "page")]
    public int Page { get; set; } = 1;

    [FromQuery(Name = "pageSize")]
    public int PageSize { get; set; } = 10;

    [FromQuery(Name = "subjectId")]
    public long? SubjectId { get; set; }

    [FromQuery(Name = "status")]
    public TutorRequestStatus? Status { get; set; }

    [FromQuery(Name = "priceMin")]
    public decimal? PricePerSessionMin { get; set; }

    [FromQuery(Name = "priceMax")]
    public decimal? PricePerSessionMax { get; set; }

    [FromQuery(Name = "area")]
    public string? Area { get; set; }

    [FromQuery(Name = "keyword")]
    public string? Keyword { get; set; }

    [FromQuery(Name = "excludeExpired")]
    public bool ExcludeExpired { get; set; }
  }
}
