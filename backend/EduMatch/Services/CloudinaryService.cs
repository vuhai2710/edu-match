using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using EduMatch.Common.Exception;
using EduMatch.Configuration;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace EduMatch.Services
{
  public class CloudinaryService : ICloudinaryService
  {
    private const long AvatarMaxSizeInBytes = 5 * 1024 * 1024;
    private const long CvMaxSizeInBytes = 10 * 1024 * 1024;
    private static readonly TimeSpan DefaultRawDownloadUrlTtl = TimeSpan.FromMinutes(30);

    private static readonly HashSet<string> AvatarExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private static readonly HashSet<string> AvatarContentTypes = ["image/jpeg", "image/png", "image/webp"];
    private static readonly HashSet<string> CvExtensions = [".pdf", ".doc", ".docx"];
    private static readonly HashSet<string> CvContentTypes =
    [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    private readonly Cloudinary _cloudinary;
    private readonly CloudinarySettings _settings;

    public CloudinaryService(IOptions<CloudinarySettings> options)
    {
      _settings = options.Value;
      _cloudinary = new Cloudinary(new Account(_settings.CloudName, _settings.ApiKey, _settings.ApiSecret));
      _cloudinary.Api.Secure = true;
    }

    public async Task<(string url, string publicId)> UploadImageAsync(IFormFile file, string folder)
    {
      EnsureConfigured();
      ValidateAvatar(file);

      using var stream = file.OpenReadStream();
      var uploadParams = new ImageUploadParams
      {
        File = new FileDescription(file.FileName, stream),
        Folder = folder,
        Transformation = new Transformation()
          .Width(400)
          .Height(400)
          .Crop("fill")
          .Gravity("face")
          .Quality("auto")
      };

      var result = await _cloudinary.UploadAsync(uploadParams);
      if (result.Error != null)
      {
        throw new System.Exception(result.Error.Message);
      }

      return (result.SecureUrl?.ToString() ?? string.Empty, result.PublicId);
    }

    public async Task<(string url, string publicId)> UploadRawAsync(IFormFile file, string folder)
    {
      EnsureConfigured();
      ValidateCv(file);

      using var stream = file.OpenReadStream();
      var uploadParams = new RawUploadParams
      {
        File = new FileDescription(file.FileName, stream),
        Folder = folder,
        Type = "upload",
        AccessMode = "public",
        AccessControl =
        [
          new AccessControlRule
          {
            AccessType = AccessType.Anonymous
          }
        ]
      };

      var result = await _cloudinary.UploadAsync(uploadParams);
      if (result.Error != null)
      {
        throw new System.Exception(result.Error.Message);
      }

      return (result.SecureUrl?.ToString() ?? string.Empty, result.PublicId);
    }

    public string BuildSignedRawDownloadUrl(string fileUrl, TimeSpan? expiresIn = null, bool attachment = false)
    {
      EnsureConfigured();

      var rawAsset = ResolveRawAsset(fileUrl);
      var expiresAt = DateTimeOffset.UtcNow
        .Add(expiresIn ?? DefaultRawDownloadUrlTtl)
        .ToUnixTimeSeconds();

      return _cloudinary.DownloadPrivate(
        rawAsset.PublicId,
        attachment,
        format: null,
        type: rawAsset.DeliveryType,
        expiresAt,
        resourceType: rawAsset.ResourceType);
    }

    public async Task DeleteAsync(string publicId, ResourceType type)
    {
      EnsureConfigured();

      if (string.IsNullOrWhiteSpace(publicId))
      {
        return;
      }

      var deletionParams = new DeletionParams(publicId)
      {
        ResourceType = type
      };

      var result = await _cloudinary.DestroyAsync(deletionParams);
      if (result.Error != null)
      {
        throw new System.Exception(result.Error.Message);
      }
    }

    private void EnsureConfigured()
    {
      if (string.IsNullOrWhiteSpace(_settings.CloudName)
          || string.IsNullOrWhiteSpace(_settings.ApiKey)
          || string.IsNullOrWhiteSpace(_settings.ApiSecret))
      {
        throw new System.Exception("Cloudinary chưa được cấu hình.");
      }
    }

    private (string PublicId, string DeliveryType, string ResourceType) ResolveRawAsset(string fileUrl)
    {
      if (!Uri.TryCreate(fileUrl, UriKind.Absolute, out var uri)
          || !string.Equals(uri.Host, "res.cloudinary.com", StringComparison.OrdinalIgnoreCase))
      {
        throw new ValidationException("URL Cloudinary không hợp lệ.", "INVALID_CLOUDINARY_URL");
      }

      var segments = uri.AbsolutePath
        .Split('/', StringSplitOptions.RemoveEmptyEntries)
        .Select(Uri.UnescapeDataString)
        .ToArray();

      if (segments.Length < 5
          || !string.Equals(segments[0], _settings.CloudName, StringComparison.OrdinalIgnoreCase)
          || !string.Equals(segments[1], "raw", StringComparison.OrdinalIgnoreCase))
      {
        throw new ValidationException("URL CV Cloudinary không hợp lệ.", "INVALID_CLOUDINARY_CV_URL");
      }

      var publicIdStartIndex = 3;
      if (segments.Length > publicIdStartIndex
          && segments[publicIdStartIndex].Length > 1
          && segments[publicIdStartIndex][0] == 'v'
          && long.TryParse(segments[publicIdStartIndex][1..], out _))
      {
        publicIdStartIndex++;
      }

      if (segments.Length <= publicIdStartIndex)
      {
        throw new ValidationException("URL CV Cloudinary thiếu public id.", "INVALID_CLOUDINARY_PUBLIC_ID");
      }

      var publicId = string.Join('/', segments[publicIdStartIndex..]);
      if (!publicId.StartsWith("edumatch/cvs/", StringComparison.OrdinalIgnoreCase))
      {
        throw new ValidationException("URL không thuộc thư mục CV của hệ thống.", "INVALID_CLOUDINARY_CV_FOLDER");
      }

      return (publicId, segments[2], segments[1]);
    }

    private static void ValidateAvatar(IFormFile file)
    {
      ValidateFile(
        file,
        AvatarMaxSizeInBytes,
        AvatarExtensions,
        AvatarContentTypes,
        "Ảnh đại diện chỉ hỗ trợ định dạng JPG, PNG hoặc WEBP.",
        "Ảnh đại diện không được vượt quá 5MB.");
    }

    private static void ValidateCv(IFormFile file)
    {
      ValidateFile(
        file,
        CvMaxSizeInBytes,
        CvExtensions,
        CvContentTypes,
        "CV chỉ hỗ trợ định dạng PDF, DOC hoặc DOCX.",
        "CV không được vượt quá 10MB.");
    }

    private static void ValidateFile(
      IFormFile file,
      long maxSizeInBytes,
      HashSet<string> allowedExtensions,
      HashSet<string> allowedContentTypes,
      string invalidTypeMessage,
      string invalidSizeMessage)
    {
      if (file == null || file.Length == 0)
      {
        throw new ValidationException(
          new Dictionary<string, string[]>
          {
            ["file"] = ["Tệp tải lên không hợp lệ."]
          },
          "INVALID_FILE_UPLOAD");
      }

      var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
      var contentType = (file.ContentType ?? string.Empty).ToLowerInvariant();

      if (!allowedExtensions.Contains(extension) || !allowedContentTypes.Contains(contentType))
      {
        throw new ValidationException(
          new Dictionary<string, string[]>
          {
            ["file"] = [invalidTypeMessage]
          },
          "INVALID_FILE_TYPE");
      }

      if (file.Length > maxSizeInBytes)
      {
        throw new ValidationException(
          new Dictionary<string, string[]>
          {
            ["file"] = [invalidSizeMessage]
          },
          "FILE_SIZE_EXCEEDED");
      }
    }
  }
}
