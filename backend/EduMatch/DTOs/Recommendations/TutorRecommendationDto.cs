using EduMatch.DTOs.Tutor;

namespace EduMatch.DTOs.Recommendations
{
  public class TutorRecommendationListDto
  {
    public bool IsFallback { get; set; }
    public List<TutorRecommendationDto> Items { get; set; } = [];
  }

  public class TutorRecommendationDto
  {
    public TutorDto Tutor { get; set; } = null!;
    public double? Similarity { get; set; }
    public List<string> Reasons { get; set; } = [];
  }
}

