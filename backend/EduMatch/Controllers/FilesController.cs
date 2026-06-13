using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace EduMatch.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  public class FilesController : ControllerBase
  {
    private readonly ICloudinaryService _cloudinaryService;
    private readonly IFileService _fileService;

    public FilesController(ICloudinaryService cloudinaryService, IFileService fileService)
    {
      _cloudinaryService = cloudinaryService;
      _fileService = fileService;
    }

    [HttpPost("registration/avatar")]
    [Consumes("multipart/form-data")]
    [SwaggerOperation(OperationId = "uploadRegistrationAvatar")]
    [ProducesResponseType(typeof(ApiResponse<RegistrationFileUploadDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<RegistrationFileUploadDto>>> UploadRegistrationAvatar(IFormFile file)
    {
      return this.OkResponse(ApiResponse<RegistrationFileUploadDto>.SuccessResult(
        await _fileService.UploadRegistrationAvatarAsync(file),
        "Tải ảnh đại diện thành công"));
    }

    [HttpPost("registration/cv")]
    [Consumes("multipart/form-data")]
    [SwaggerOperation(OperationId = "uploadRegistrationCv")]
    [ProducesResponseType(typeof(ApiResponse<RegistrationFileUploadDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<RegistrationFileUploadDto>>> UploadRegistrationCv(IFormFile file)
    {
      return this.OkResponse(ApiResponse<RegistrationFileUploadDto>.SuccessResult(
        await _fileService.UploadRegistrationCvAsync(file),
        "Tải CV thành công"));
    }

    [HttpGet("cloudinary/view")]
    [SwaggerOperation(OperationId = "viewCloudinaryFile")]
    [ProducesResponseType(StatusCodes.Status302Found)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public ActionResult ViewCloudinaryFile([FromQuery] string? fileUrl)
    {
      if (string.IsNullOrWhiteSpace(fileUrl))
      {
        ModelState.AddModelError("fileUrl", "URL Cloudinary là bắt buộc.");
        return ValidationProblem(ModelState);
      }

      var signedUrl = _cloudinaryService.BuildSignedRawDownloadUrl(fileUrl);
      return Redirect(signedUrl);
    }
  }
}
