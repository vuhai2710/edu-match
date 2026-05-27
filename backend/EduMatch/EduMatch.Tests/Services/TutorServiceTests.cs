using AutoMapper;
using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.Mappers;
using EduMatch.Models;
using EduMatch.Repositories;
using EduMatch.Services;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Moq;

namespace EduMatch.Tests.Services;

public class TutorServiceTests
{
  private readonly Mock<ITutorRepository> _tutorRepository = new();
  private readonly TutorService _service;

  public TutorServiceTests()
  {
    var services = new ServiceCollection();
    services.AddLogging();
    services.AddAutoMapper(cfg => cfg.AddProfile<TutorMapper>());
    var mapper = services.BuildServiceProvider().GetRequiredService<IMapper>();

    _service = new TutorService(
      _tutorRepository.Object,
      Mock.Of<IRepository<User>>(),
      Mock.Of<IRepository<Subject>>(),
      Mock.Of<IRepository<TutorSubject>>(),
      Mock.Of<IRepository<TutorTeachingLevel>>(),
      Mock.Of<IFileService>(),
      mapper,
      Mock.Of<ICodeGeneratorService>(),
      Mock.Of<IHttpContextAccessor>());
  }

  [Fact]
  public async Task GetTutorByIdOrCodeAsync_UsesNumericId_WhenRouteValueIsNumber()
  {
    var tutor = CreateTutor(25, "TUT00025");
    _tutorRepository
      .Setup(repo => repo.GetTutorProfileDetailAsync(25))
      .ReturnsAsync(tutor);

    var result = await _service.GetTutorByIdOrCodeAsync("25");

    Assert.Equal(25, result.Id);
    Assert.Equal("TUT00025", result.Code);
  }

  [Fact]
  public async Task GetTutorByIdOrCodeAsync_FallsBackToTutorCode_WhenRouteValueIsCode()
  {
    var tutor = CreateTutor(25, "TUT00025");
    _tutorRepository
      .Setup(repo => repo.GetTutorProfileDetailByCodeAsync("TUT00025"))
      .ReturnsAsync(tutor);

    var result = await _service.GetTutorByIdOrCodeAsync("TUT00025");

    Assert.Equal(25, result.Id);
    Assert.Equal("TUT00025", result.Code);
  }

  [Fact]
  public async Task GetTutorByIdOrCodeAsync_ThrowsNotFound_WhenNoTutorMatches()
  {
    _tutorRepository
      .Setup(repo => repo.GetTutorProfileDetailByCodeAsync("TUT99999"))
      .ReturnsAsync((Tutor?)null);

    await Assert.ThrowsAsync<NotFoundException>(() => _service.GetTutorByIdOrCodeAsync("TUT99999"));
  }

  private static Tutor CreateTutor(long id, string code)
  {
    return new Tutor
    {
      Id = id,
      Code = code,
      UserId = 10,
      User = new User
      {
        Id = 10,
        FullName = "Tutor User",
        Email = "tutor@gmail.com",
        Gender = Gender.Male
      },
      Major = "Mathematics"
    };
  }
}
