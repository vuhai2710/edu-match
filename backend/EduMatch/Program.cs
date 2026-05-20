using EduMatch.Common.Exception;
using EduMatch.Common.Extensions;
using EduMatch.Common.Middleware;
using EduMatch.Configuration;
using EduMatch.Configurations;
using EduMatch.Data;
using EduMatch.Domain.Booking;
using EduMatch.DTOs;
using EduMatch.Repositories;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
  .AddJsonOptions(options =>
  {
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
  });

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
  options.InvalidModelStateResponseFactory = context =>
  {
    var errorEntries = context.ModelState
      .Where(entry => entry.Value?.Errors.Count > 0)
      .Select(entry => new { entry.Key, Errors = entry.Value?.Errors ?? [] })
      .ToList();

    var errors = errorEntries
      .SelectMany(entry => entry.Errors.Select(error =>
        string.IsNullOrWhiteSpace(error.ErrorMessage)
          ? $"Giá trị của trường '{entry.Key}' không hợp lệ."
          : error.ErrorMessage))
      .ToList();

    var message = errors.Count > 0
      ? string.Join(" ", errors)
      : "Dữ liệu gửi lên không hợp lệ.";

    return new BadRequestObjectResult(ErrorResponse.Create(message, "VALIDATION_ERROR"));
  };
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddAutoMapper(cfg => cfg.AddMaps(typeof(Program)));
builder.Services.AddSignalR();
builder.Services.AddBookingDomainServices();

builder.Services.AddSwaggerGen(options =>
{
  options.SwaggerDoc("v1", new OpenApiInfo
  {
    Title = "EduMatch API",
    Version = "v1"
  });

  options.EnableAnnotations();
  options.OperationFilter<FileUploadOperationFilter>();
  options.OperationFilter<AuthorizeOperationFilter>();
  options.DocumentFilter<SchemaCleanupFilter>();

  options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
  {
    Type = SecuritySchemeType.Http,
    Scheme = "bearer",
    BearerFormat = "JWT",
    Description = "Nhập: Bearer {token}"
  });
});

builder.Services.AddDbContext<AppDbContext>(options =>
  options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var jwtKey = builder.Configuration["Jwt:Key"]!;
var jwtIssuer = builder.Configuration["Jwt:Issuer"]!;
var jwtAudience = builder.Configuration["Jwt:Audience"]!;

builder.Services.AddAuthentication(options =>
  {
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
  })
  .AddJwtBearer(options =>
  {
    options.TokenValidationParameters = new TokenValidationParameters
    {
      ValidateIssuer = true,
      ValidateAudience = true,
      ValidateLifetime = true,
      ValidateIssuerSigningKey = true,
      ValidIssuer = jwtIssuer,
      ValidAudience = jwtAudience,
      IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
      ClockSkew = TimeSpan.Zero
    };

    options.Events = new JwtBearerEvents
    {
      OnMessageReceived = context =>
      {
        var accessToken = context.Request.Query["access_token"];
        var path = context.HttpContext.Request.Path;

        if (!string.IsNullOrWhiteSpace(accessToken) && path.StartsWithSegments("/hubs/notifications"))
        {
          context.Token = accessToken;
        }

        return Task.CompletedTask;
      },
      OnChallenge = async context =>
      {
        if (context.Response.HasStarted)
        {
          return;
        }

        context.HandleResponse();
        await context.Response.WriteErrorResponseAsync(
          StatusCodes.Status401Unauthorized,
          "Phiên đăng nhập hết hạn",
          "UNAUTHORIZED");
      },
      OnForbidden = async context =>
      {
        if (context.Response.HasStarted)
        {
          return;
        }

        await context.Response.WriteErrorResponseAsync(
          StatusCodes.Status403Forbidden,
          "Bạn không có quyền thực hiện thao tác này",
          "FORBIDDEN");
      }
    };
  });

builder.Services.AddAuthorization();
builder.Services.AddRateLimiter(options =>
{
  options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
  options.OnRejected = async (context, _) =>
  {
    if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
    {
      context.HttpContext.Response.Headers["Retry-After"] =
        ((int)Math.Ceiling(retryAfter.TotalSeconds)).ToString();
    }

    await context.HttpContext.Response.WriteErrorResponseAsync(
      StatusCodes.Status429TooManyRequests,
      "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.",
      "RATE_LIMIT_EXCEEDED");
  };

  options.AddPolicy("auth-login", httpContext =>
  {
    var partitionKey = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    return RateLimitPartition.GetFixedWindowLimiter(
      partitionKey,
      _ => new FixedWindowRateLimiterOptions
      {
        PermitLimit = 5,
        Window = TimeSpan.FromMinutes(1),
        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
        QueueLimit = 0,
        AutoReplenishment = true
      });
  });

  options.AddPolicy("auth-forgot-password", httpContext =>
  {
    var partitionKey = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    return RateLimitPartition.GetFixedWindowLimiter(
      partitionKey,
      _ => new FixedWindowRateLimiterOptions
      {
        PermitLimit = 3,
        Window = TimeSpan.FromMinutes(15),
        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
        QueueLimit = 0,
        AutoReplenishment = true
      });
  });
});

builder.Services.AddScoped<AuthService>();

#region Dependency Injection
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<IAddressService, AddressService>((sp, client) =>
{
  var baseUrl = sp.GetRequiredService<IConfiguration>()["AddressApi:BaseUrl"];
  if (string.IsNullOrWhiteSpace(baseUrl))
  {
    return;
  }

  if (Uri.TryCreate(baseUrl, UriKind.Absolute, out var baseUri))
  {
    client.BaseAddress = baseUri;
  }
});

builder.Services.AddScoped(typeof(EduMatch.Repositories.IRepository<>), typeof(EduMatch.Repositories.Repository<>));
builder.Services.AddScoped<EduMatch.Repositories.ITutorRepository, EduMatch.Repositories.TutorRepository>();
builder.Services.AddScoped<EduMatch.Services.ITutorService, EduMatch.Services.TutorService>();
builder.Services.AddScoped<EduMatch.Repositories.Interfaces.IStudentRepository, EduMatch.Repositories.StudentRepository>();
builder.Services.AddScoped<EduMatch.Services.Interfaces.IStudentService, EduMatch.Services.StudentService>();
builder.Services.AddScoped<EduMatch.Repositories.Interfaces.IUserRepository, EduMatch.Repositories.UserRepository>();
builder.Services.AddScoped<EduMatch.Services.Interfaces.IUserService, EduMatch.Services.UserService>();
builder.Services.AddScoped<IFileRepository, FileRepository>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.Configure<CloudinarySettings>(builder.Configuration.GetSection("Cloudinary"));
builder.Services.AddSingleton<ICloudinaryService, CloudinaryService>();
builder.Services.AddScoped<ITutorRequestRepository, TutorRequestRepository>();
builder.Services.AddScoped<IApplicationRepository, ApplicationRepository>();
builder.Services.AddScoped<ITutorRequestService, TutorRequestService>();
builder.Services.AddScoped<IApplicationService, ApplicationService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<EduMatch.Repositories.Interfaces.INotificationRepository, EduMatch.Repositories.NotificationRepository>();
builder.Services.AddScoped<EduMatch.Services.Interfaces.INotificationService, EduMatch.Services.NotificationService>();
builder.Services.AddScoped<IClassRepository, ClassRepository>();
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.Configure<PayOSSettings>(builder.Configuration.GetSection("PayOS"));
builder.Services.AddHttpClient<IPaymentService, PaymentService>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddHostedService<RequestExpiryBackgroundService>();

builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("Email"));
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IPasswordResetTokenRepository, PasswordResetTokenRepository>();
builder.Services.AddScoped<IPasswordResetService, PasswordResetService>();

builder.Services.AddSingleton<ICodeGeneratorService, CodeGeneratorService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

builder.Services.AddScoped<ISubjectRepository, SubjectRepository>();
builder.Services.AddScoped<ISubjectService, SubjectService>();
#endregion

builder.Services.AddCors(options =>
{
  options.AddPolicy("AllowAngular", policy =>
  {
    policy
      .WithOrigins(
        "https://localhost:4200",
        "http://localhost:4200")
      .AllowAnyHeader()
      .AllowAnyMethod()
      .AllowCredentials();
  });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
  var services = scope.ServiceProvider;
  await SeedData.Initialize(services);
}

app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();

if (app.Environment.IsDevelopment())
{
  app.UseSwagger();
  app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAngular");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<ChatHub>("/hubs/chat");

app.Run();
