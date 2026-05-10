using EduMatch.Common.Exception;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using FileEntity = EduMatch.Models.File;

namespace EduMatch.Services
{
  public class FileService : IFileService
  {
    private readonly ICloudinaryService _cloudinaryService;
    private readonly IFileRepository _fileRepository;

    public FileService(ICloudinaryService cloudinaryService, IFileRepository fileRepository)
    {
      _cloudinaryService = cloudinaryService;
      _fileRepository = fileRepository;
    }

    public async Task<FileEntity> UploadAvatarAsync(IFormFile formFile, string folder = "edumatch/avatars")
    {
      var (url, _) = await _cloudinaryService.UploadImageAsync(formFile, folder);

      var file = new FileEntity
      {
        FileName = Path.GetFileName(formFile.FileName),
        FileSize = formFile.Length,
        ContentType = formFile.ContentType ?? string.Empty,
        FileType = "avatar",
        FilePath = url
      };

      return await _fileRepository.CreateAsync(file);
    }

    public async Task<FileEntity> UploadCvAsync(IFormFile formFile, string folder = "edumatch/cvs")
    {
      var (url, _) = await _cloudinaryService.UploadRawAsync(formFile, folder);

      var file = new FileEntity
      {
        FileName = Path.GetFileName(formFile.FileName),
        FileSize = formFile.Length,
        ContentType = formFile.ContentType ?? string.Empty,
        FileType = "cv",
        FilePath = url
      };

      return await _fileRepository.CreateAsync(file);
    }

    public async Task<FileEntity> CreateAvatarReferenceAsync(string fileUrl, string? fileName = null)
    {
      if (string.IsNullOrWhiteSpace(fileUrl))
      {
        throw new ArgumentException("URL ảnh đại diện không hợp lệ.");
      }

      var file = new FileEntity
      {
        FileName = ResolveFileName(fileUrl, fileName),
        FileSize = 0,
        ContentType = ResolveContentType(fileUrl),
        FileType = "avatar",
        FilePath = fileUrl
      };

      return await _fileRepository.CreateAsync(file);
    }

    public async Task DeleteFileRecordAsync(long fileId)
    {
      var file = await _fileRepository.GetByIdAsync(fileId);
      if (file == null || file.IsDeleted)
      {
        throw new NotFoundException("File không tồn tại");
      }

      file.IsDeleted = true;
      file.UpdatedAt = DateTime.UtcNow;
      await _fileRepository.UpdateAsync(file);
    }

    private static string ResolveFileName(string fileUrl, string? providedFileName)
    {
      if (!string.IsNullOrWhiteSpace(providedFileName))
      {
        return providedFileName;
      }

      if (Uri.TryCreate(fileUrl, UriKind.Absolute, out var uri))
      {
        var fileName = Path.GetFileName(uri.AbsolutePath);
        if (!string.IsNullOrWhiteSpace(fileName))
        {
          return fileName;
        }
      }

      return "external-avatar";
    }

    private static string ResolveContentType(string fileUrl)
    {
      var extension = string.Empty;
      if (Uri.TryCreate(fileUrl, UriKind.Absolute, out var uri))
      {
        extension = Path.GetExtension(uri.AbsolutePath).ToLowerInvariant();
      }

      return extension switch
      {
        ".png" => "image/png",
        ".webp" => "image/webp",
        ".jpg" or ".jpeg" => "image/jpeg",
        _ => "image/jpeg"
      };
    }
  }
}
