using FileEntity = EduMatch.Models.File;

namespace EduMatch.Repositories.Interfaces
{
  public interface IFileRepository
  {
    Task<FileEntity> CreateAsync(FileEntity file);
    Task<FileEntity?> GetByIdAsync(long id);
    Task UpdateAsync(FileEntity file);
  }
}
