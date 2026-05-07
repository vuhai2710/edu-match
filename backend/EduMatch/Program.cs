using EduMatch.Data;
using EduMatch.Exception;
using EduMatch.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
  options.SwaggerDoc("v1", new OpenApiInfo
  {
    Title = "EduMatch API",
    Version = "v1"
  });

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
  });

builder.Services.AddAuthorization();

builder.Services.AddScoped<AuthService>();

#region Dependency Injection
builder.Services.AddScoped(typeof(EduMatch.Repositories.IRepository<>), typeof(EduMatch.Repositories.Repository<>));
builder.Services.AddScoped<EduMatch.Repositories.ITutorRepository, EduMatch.Repositories.TutorRepository>();
builder.Services.AddScoped<EduMatch.Services.ITutorService, EduMatch.Services.TutorService>();
builder.Services.AddScoped<EduMatch.Repositories.Interfaces.IStudentRepository, EduMatch.Repositories.StudentRepository>();
builder.Services.AddScoped<EduMatch.Services.Interfaces.IStudentService, EduMatch.Services.StudentService>();
builder.Services.AddScoped<EduMatch.Repositories.Interfaces.IUserRepository, EduMatch.Repositories.UserRepository>();
builder.Services.AddScoped<EduMatch.Services.Interfaces.IUserService, EduMatch.Services.UserService>();
#endregion

builder.Services.AddCors(options =>
{
  options.AddPolicy("DevPolicy", policy =>
  {
    policy.WithOrigins("http://localhost:4200")
      .AllowAnyHeader()
      .AllowAnyMethod();
  });
});

var app = builder.Build();

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

app.Run();
