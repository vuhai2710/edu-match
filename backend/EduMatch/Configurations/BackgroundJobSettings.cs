namespace EduMatch.Configurations
{
  public class BackgroundJobSettings
  {
    public const string SectionName = "BackgroundJobs";
    public int ScheduleExpiryIntervalSeconds { get; set; } = 60;
    public int PaymentExpiryIntervalSeconds { get; set; } = 60;
    public int ClassActivationIntervalSeconds { get; set; } = 300;
    public int CompletionAutoConfirmIntervalSeconds { get; set; } = 300;
  }
}
