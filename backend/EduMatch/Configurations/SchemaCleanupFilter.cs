using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace EduMatch.Configuration
{
  public class SchemaCleanupFilter : IDocumentFilter
  {
    private static readonly string[] HiddenSchemas =
    [
      "Tutor", "Application", "TutorRequest", "User", "Message",
      "Notification", "Class", "TutorSubject", "Address",
      "Subject", "Student", "PasswordResetToken", "File"
    ];

    public void Apply(OpenApiDocument swaggerDoc, DocumentFilterContext context)
    {
      var schemas = swaggerDoc.Components?.Schemas;
      if (schemas == null || schemas.Count == 0)
      {
        return;
      }

      foreach (var schema in HiddenSchemas)
      {
        schemas.Remove(schema);
      }
    }
  }
}
