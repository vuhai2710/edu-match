using AutoMapper;
using EduMatch.DTOs.User;
using EduMatch.Models;

namespace EduMatch.Mappers;

public class UserMapper : Profile
{
  public UserMapper()
  {
    CreateMap<User, UserDto>()
      .ForMember(d => d.AvatarUrl, opt => opt.MapFrom(s => s.AvatarFile != null ? s.AvatarFile.FilePath : null))
      .ForMember(d => d.Code, opt => opt.MapFrom(s =>
        s.Student != null ? s.Student.Code :
        s.Tutor != null ? s.Tutor.Code :
        null));
  }
}
