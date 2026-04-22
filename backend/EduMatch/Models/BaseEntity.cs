namespace EduMatch.Models
{
  public abstract class BaseEntity
  {
    public long Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdateAt { get; set; }
    public bool IsDeleted { get; set; } = false;
  }
}
