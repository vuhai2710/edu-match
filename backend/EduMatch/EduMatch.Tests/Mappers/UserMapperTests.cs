using AutoMapper;
using EduMatch.Common.Enums;
using EduMatch.DTOs.User;
using EduMatch.Mappers;
using EduMatch.Models;
using Microsoft.Extensions.DependencyInjection;

namespace EduMatch.Tests.Mappers;

public class UserMapperTests
{
  private readonly IMapper _mapper;

  public UserMapperTests()
  {
    var services = new ServiceCollection();
    services.AddLogging();
    services.AddAutoMapper(cfg => cfg.AddProfile<UserMapper>());
    _mapper = services.BuildServiceProvider().GetRequiredService<IMapper>();
  }

  [Fact]
  public void Map_UserWithTutorProfile_UsesTutorCode()
  {
    var user = new User
    {
      Id = 10,
      FullName = "Tutor User",
      Email = "tutor@gmail.com",
      Gender = Gender.Male,
      Role = UserRole.Tutor,
      Tutor = new Tutor
      {
        Id = 25,
        Code = "TUT00025"
      }
    };

    var result = _mapper.Map<UserDto>(user);

    Assert.Equal("TUT00025", result.Code);
  }

  [Fact]
  public void Map_UserWithStudentProfile_UsesStudentCode()
  {
    var user = new User
    {
      Id = 11,
      FullName = "Student User",
      Email = "student@gmail.com",
      Gender = Gender.Female,
      Role = UserRole.Student,
      Student = new Student
      {
        Id = 18,
        Code = "STD00018"
      }
    };

    var result = _mapper.Map<UserDto>(user);

    Assert.Equal("STD00018", result.Code);
  }
}
