using EduMatch.Data;
using EduMatch.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using FileEntity = EduMatch.Models.File;

namespace EduMatch.Repositories
{
  public class FileRepository : IFileRepository
  {
    private readonly AppDbContext _context;

    public FileRepository(AppDbContext context)
    {
      _context = context;
    }

    public async Task<FileEntity> CreateAsync(FileEntity file)
    {
      await _context.Files.AddAsync(file);
      await _context.SaveChangesAsync();
      return file;
    }

    public async Task<FileEntity?> GetByIdAsync(long id)
    {
      return await _context.Files.FirstOrDefaultAsync(file => file.Id == id);
    }
  }
}
