using EduMatch.Configuration;
using EduMatch.Configurations;
using EduMatch.Data;
using EduMatch.Exception;
using EduMatch.Repositories;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services;
using EduMatch.Services.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddAutoMapper(cfg => cfg.AddMaps(typeof(Program)));
builder.Services.AddSignalR();

builder.Services.AddSwaggerGen(options =>
{
  options.SwaggerDoc("v1", new OpenApiInfo
  {
    Title = "EduMatch API",
    Version = "v1"
  });
  options.OperationFilter<FileUploadOperationFilter>();

  options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
  {
    Name = "Authorization",
    Type = SecuritySchemeType.ApiKey,
    In = ParameterLocation.Header,
    Description = "Nhập: Bearer {token}"
  });

  options.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
  {
    {
      new OpenApiSecuritySchemeReference("Bearer", doc, null),
      new List<string>()
    }
  });
});

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

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
      }
    };
  });

builder.Services.AddAuthorization();

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
builder.Services.AddHostedService<RequestExpiryBackgroundService>();

builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("Email"));
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IPasswordResetTokenRepository, PasswordResetTokenRepository>();
builder.Services.AddScoped<IPasswordResetService, PasswordResetService>();
#endregion

builder.Services.AddCors(options =>
{
  options.AddPolicy("DevPolicy", policy =>
  {
    policy.WithOrigins("http://localhost:4200")
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

if (app.Environment.IsDevelopment())
{
  app.UseSwagger();
  app.UseSwaggerUI();
}

app.UseCors("DevPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<ChatHub>("/hubs/chat");

app.Run();
