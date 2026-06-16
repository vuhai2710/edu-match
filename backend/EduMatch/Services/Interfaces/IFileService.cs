using Microsoft.AspNetCore.Http;
using EduMatch.DTOs;
using FileEntity = EduMatch.Models.File;

namespace EduMatch.Services.Interfaces
{
  public interface IFileService
  {
    Task<FileEntity> UploadAvatarAsync(IFormFile formFile, string folder = "edumatch/avatars");
    Task<FileEntity> UploadCvAsync(IFormFile formFile, string folder = "edumatch/cvs");
    Task<RegistrationFileUploadDto> UploadRegistrationAvatarAsync(IFormFile formFile);
    Task<RegistrationFileUploadDto> UploadRegistrationCvAsync(IFormFile formFile);
    Task<FileEntity> ClaimRegistrationUploadAsync(long fileId, string uploadToken, string purpose);
    Task<int> CleanupExpiredRegistrationUploadsAsync(DateTime now);
    Task<FileEntity> CreateAvatarReferenceAsync(string fileUrl, string? fileName = null);
    Task DeleteFileRecordAsync(long fileId);
  }
}
