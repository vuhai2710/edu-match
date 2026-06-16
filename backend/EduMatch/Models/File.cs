namespace EduMatch.Models
{
  public class File : BaseEntity
  {
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public bool IsTemporary { get; set; }
    public string? UploadToken { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? UsedAt { get; set; }
  }
}
