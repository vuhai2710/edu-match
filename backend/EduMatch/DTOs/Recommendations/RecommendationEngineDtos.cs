namespace EduMatch.DTOs.Recommendations
{
  public class RecommendationEngineRequest
  {
    public RecommendationEngineStudentDto Student { get; set; } = new();
    public List<RecommendationEngineCandidateDto> Candidates { get; set; } = [];
    public int RankingLimit { get; set; }
  }

  public class RecommendationEngineStudentDto
  {
    public long StudentId { get; set; }
    public string? GradeLevel { get; set; }
    public List<long> SubjectIds { get; set; } = [];
    public List<string> SubjectNames { get; set; } = [];
    public List<string> LearningRequestTexts { get; set; } = [];
    public string? SearchTerm { get; set; }
  }

  public class RecommendationEngineCandidateDto
  {
    public long TutorId { get; set; }
    public List<long> SubjectIds { get; set; } = [];
    public List<string> SubjectNames { get; set; } = [];
    public List<string> TeachingLevels { get; set; } = [];
    public string? Major { get; set; }
    public string? Profile { get; set; }
    public string? School { get; set; }
  }

  public class RecommendationEngineResponse
  {
    public DateTime GeneratedAtUtc { get; set; }
    public List<RecommendationEngineItemDto> Recommendations { get; set; } = [];
  }

  public class RecommendationEngineItemDto
  {
    public long TutorId { get; set; }
    public double Similarity { get; set; }
  }
}

