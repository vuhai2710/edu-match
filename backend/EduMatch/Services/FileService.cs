using EduMatch.Common.Exception;
using EduMatch.DTOs;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;
using FileEntity = EduMatch.Models.File;

namespace EduMatch.Services
{
  public class FileService : IFileService
  {
    private static readonly TimeSpan RegistrationUploadLifetime = TimeSpan.FromHours(24);
    private const string RegistrationAvatarPurpose = "registration-avatar";
    private const string RegistrationCvPurpose = "registration-cv";
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

    public async Task<RegistrationFileUploadDto> UploadRegistrationAvatarAsync(IFormFile formFile)
    {
      var file = await UploadAvatarAsync(formFile, "edumatch/registration/avatars");
      return await MarkAsRegistrationDraftAsync(file, RegistrationAvatarPurpose);
    }

    public async Task<RegistrationFileUploadDto> UploadRegistrationCvAsync(IFormFile formFile)
    {
      var file = await UploadCvAsync(formFile, "edumatch/registration/cvs");
      return await MarkAsRegistrationDraftAsync(file, RegistrationCvPurpose);
    }

    public async Task<FileEntity> ClaimRegistrationUploadAsync(long fileId, string uploadToken, string purpose)
    {
      if (fileId <= 0 || string.IsNullOrWhiteSpace(uploadToken) || string.IsNullOrWhiteSpace(purpose))
      {
        throw new ValidationException("Tệp tải lên không hợp lệ.", "INVALID_REGISTRATION_UPLOAD");
      }

      var file = await _fileRepository.GetByIdAsync(fileId);
      if (file == null || file.IsDeleted)
      {
        throw new NotFoundException("Tệp tải lên không tồn tại.", "REGISTRATION_UPLOAD_NOT_FOUND");
      }

      if (!file.IsTemporary
          || file.UsedAt != null
          || !string.Equals(file.UploadToken, uploadToken.Trim(), StringComparison.Ordinal)
          || !string.Equals(file.FileType, purpose, StringComparison.OrdinalIgnoreCase))
      {
        throw new ValidationException("Tệp tải lên không hợp lệ hoặc đã được sử dụng.", "INVALID_REGISTRATION_UPLOAD");
      }

      if (file.ExpiresAt.HasValue && file.ExpiresAt <= DateTime.UtcNow)
      {
        throw new ValidationException("Tệp tải lên đã hết hạn. Vui lòng tải lại tệp.", "REGISTRATION_UPLOAD_EXPIRED");
      }

      file.IsTemporary = false;
      file.UploadToken = null;
      file.UsedAt = DateTime.UtcNow;
      file.ExpiresAt = null;
      file.FileType = purpose == RegistrationAvatarPurpose ? "avatar" : "cv";
      await _fileRepository.UpdateAsync(file);

      return file;
    }

    public Task<int> CleanupExpiredRegistrationUploadsAsync(DateTime now)
    {
      return _fileRepository.CleanupExpiredTemporaryAsync(now);
    }

    public async Task<FileEntity> CreateAvatarReferenceAsync(string fileUrl, string? fileName = null)
    {
      if (string.IsNullOrWhiteSpace(fileUrl))
      {
        throw new ValidationException(
          new Dictionary<string, string[]>
          {
            ["fileUrl"] = ["URL ảnh đại diện không hợp lệ."]
          },
          "INVALID_AVATAR_URL");
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

    private async Task<RegistrationFileUploadDto> MarkAsRegistrationDraftAsync(FileEntity file, string purpose)
    {
      var token = GenerateUploadToken();
      var expiresAt = DateTime.UtcNow.Add(RegistrationUploadLifetime);

      file.FileType = purpose;
      file.IsTemporary = true;
      file.UploadToken = token;
      file.ExpiresAt = expiresAt;
      file.UsedAt = null;

      await _fileRepository.UpdateAsync(file);

      return new RegistrationFileUploadDto
      {
        FileId = file.Id,
        FileUrl = file.FilePath,
        UploadToken = token,
        Purpose = purpose,
        ExpiresAt = expiresAt
      };
    }

    private static string GenerateUploadToken()
    {
      var bytes = new byte[32];
      using var rng = RandomNumberGenerator.Create();
      rng.GetBytes(bytes);
      return Base64UrlEncoder.Encode(bytes);
    }
  }
}
