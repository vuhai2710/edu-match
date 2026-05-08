using Microsoft.AspNetCore.Http;
using FileEntity = EduMatch.Models.File;

namespace EduMatch.Services.Interfaces
{
  public interface IFileService
  {
    Task<FileEntity> UploadAvatarAsync(IFormFile formFile, string folder = "edumatch/avatars");
    Task<FileEntity> UploadCvAsync(IFormFile formFile, string folder = "edumatch/cvs");
    Task<FileEntity> CreateAvatarReferenceAsync(string fileUrl, string? fileName = null);
    Task DeleteFileRecordAsync(long fileId);
  }
}
