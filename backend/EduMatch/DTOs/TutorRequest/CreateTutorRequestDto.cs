using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.TutorRequests
{
  public class CreateTutorRequestDto
  {
    [Required]
    public long SubjectId { get; set; }

    [MaxLength(1000)]
    public string? Note { get; set; }

    [Required]
    [Range(0, 10_000_000)]
    public decimal BudgetMax { get; set; }

    [Required]
    public DateTime ExpiresAt { get; set; }

    public string? PreferredSchedule { get; set; }

    [Range(1, 7)]
    public int? SessionsPerWeek { get; set; }

    [Range(30, 240)]
    public int? MinutesPerSession { get; set; }

    public int? ProvinceId { get; set; }
    public string? ProvinceName { get; set; }
    public string? WardCode { get; set; }
    public string? WardName { get; set; }
    public string? AddressDetail { get; set; }
  }
}
