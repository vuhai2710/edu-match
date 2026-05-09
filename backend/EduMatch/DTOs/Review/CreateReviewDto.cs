using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Review
{
  public class CreateReviewDto
  {
    [Required]
    public long ClassId { get; set; }

    [Required]
    [Range(1, 5)]
    public int Rating { get; set; }

    [MaxLength(1000)]
    public string? Comment { get; set; }
  }
}
