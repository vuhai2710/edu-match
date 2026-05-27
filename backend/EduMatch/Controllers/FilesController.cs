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

    public FilesController(ICloudinaryService cloudinaryService)
    {
      _cloudinaryService = cloudinaryService;
    }

    [HttpGet("cloudinary/view")]
    [SwaggerOperation(OperationId = "viewCloudinaryFile")]
    [ProducesResponseType(StatusCodes.Status302Found)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public ActionResult ViewCloudinaryFile([FromQuery] string fileUrl)
    {
      var signedUrl = _cloudinaryService.BuildSignedRawDownloadUrl(fileUrl);
      return Redirect(signedUrl);
    }
  }
}
