using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;

namespace EduMatch.Services.Interfaces
{
  public interface ICloudinaryService
  {
    Task<(string url, string publicId)> UploadImageAsync(IFormFile file, string folder);
    Task<(string url, string publicId)> UploadRawAsync(IFormFile file, string folder);
    Task DeleteAsync(string publicId, ResourceType type);
  }
}
