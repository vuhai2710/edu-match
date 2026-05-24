using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace EduMatch.Configuration
{
  public class AuthorizeOperationFilter : IOperationFilter
  {
    private static readonly OpenApiDocument BearerReferenceHostDocument = new()
    {
      Components = new OpenApiComponents
      {
        SecuritySchemes = new Dictionary<string, IOpenApiSecurityScheme>
        {
          ["Bearer"] = new OpenApiSecurityScheme
          {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT"
          }
        }
      }
    };

    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
      var methodInfo = context.MethodInfo;
      var declaringType = methodInfo.DeclaringType;

      var hasAllowAnonymous =
        methodInfo.GetCustomAttributes(true).OfType<AllowAnonymousAttribute>().Any()
        || (declaringType?.GetCustomAttributes(true).OfType<AllowAnonymousAttribute>().Any() ?? false);

      if (hasAllowAnonymous)
      {
        return;
      }

      var hasAuthorize =
        methodInfo.GetCustomAttributes(true).OfType<AuthorizeAttribute>().Any()
        || (declaringType?.GetCustomAttributes(true).OfType<AuthorizeAttribute>().Any() ?? false);

      if (!hasAuthorize)
      {
        return;
      }

      operation.Security ??= [];
      operation.Security.Add(new OpenApiSecurityRequirement
      {
        [new OpenApiSecuritySchemeReference("Bearer", BearerReferenceHostDocument, null)] = []
      });
    }
  }
}
