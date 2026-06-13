using FileEntity = EduMatch.Models.File;

namespace EduMatch.Repositories.Interfaces
{
  public interface IFileRepository
  {
    Task<FileEntity> CreateAsync(FileEntity file);
    Task<FileEntity?> GetByIdAsync(long id);
    Task<int> CleanupExpiredTemporaryAsync(DateTime now);
    Task UpdateAsync(FileEntity file);
  }
}
