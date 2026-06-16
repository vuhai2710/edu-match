namespace EduMatch.DTOs
{
  public class RegistrationFileUploadDto
  {
    public long FileId { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string UploadToken { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
  }
}
