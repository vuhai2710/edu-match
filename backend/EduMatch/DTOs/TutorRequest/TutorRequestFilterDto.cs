using EduMatch.Enums;

namespace EduMatch.DTOs.TutorRequests
{
  public class TutorRequestFilterDto
  {
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public long? SubjectId { get; set; }
    public TutorRequestStatus? Status { get; set; }
    public decimal? BudgetMin { get; set; }
    public decimal? BudgetMax { get; set; }
    public string? Area { get; set; }
    public string? Keyword { get; set; }
    public bool ExcludeExpired { get; set; }
  }
}
