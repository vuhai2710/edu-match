namespace EduMatch.Configurations
{
  public class RecommendationOptions
  {
    public const string SectionName = "Recommendation";

    public string BaseUrl { get; set; } = "http://127.0.0.1:8000";
    public int TimeoutSeconds { get; set; } = 3;
    public int RankingLimit { get; set; } = 50;
  }
}

