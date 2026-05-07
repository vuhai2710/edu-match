using AutoMapper;
using EduMatch.DTOs.User;
using EduMatch.Models;

namespace EduMatch.Mappers;

public class UserMapper : Profile
{
  public UserMapper()
  {
    CreateMap<User, UserDto>();
  }
}
