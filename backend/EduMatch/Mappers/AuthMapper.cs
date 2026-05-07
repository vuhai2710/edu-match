using AutoMapper;
using EduMatch.DTOs.User;
using EduMatch.Models;

namespace EduMatch.Mappers;

public class AuthMapper : Profile
{
  public AuthMapper()
  {
    CreateMap<User, UserDto>();
  }
}
