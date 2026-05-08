using Microsoft.AspNetCore.Http;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace EduMatch.Configuration
{
  public class FileUploadOperationFilter : IOperationFilter
  {
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
      var fileParameters = context.MethodInfo.GetParameters()
        .Where(parameter => parameter.ParameterType == typeof(IFormFile))
        .ToList();

      if (!fileParameters.Any())
      {
        return;
      }

      operation.RequestBody = new OpenApiRequestBody
      {
        Required = true,
        Content = new Dictionary<string, OpenApiMediaType>
        {
          ["multipart/form-data"] = new OpenApiMediaType
          {
            Schema = new OpenApiSchema
            {
              Type = JsonSchemaType.Object,
              Properties = fileParameters.ToDictionary(
                parameter => parameter.Name ?? "file",
                _ => (IOpenApiSchema)new OpenApiSchema
                {
                  Type = JsonSchemaType.String,
                  Format = "binary"
                }),
              Required = new HashSet<string>(fileParameters
                .Select(parameter => parameter.Name)
                .Where(name => !string.IsNullOrWhiteSpace(name))!)
            }
          }
        }
      };
    }
  }
}
