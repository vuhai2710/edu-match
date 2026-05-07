using AutoMapper;
using EduMatch.DTOs.StudentProfile;
using EduMatch.Models;

namespace EduMatch.Mappers;

public class StudentMapper : Profile
{
  public StudentMapper()
  {
    CreateMap<Student, StudentDto>()
      .ForMember(d => d.FullName, opt => opt.MapFrom(s => s.User.FullName))
      .ForMember(d => d.AvatarUrl, opt => opt.MapFrom(s => s.User.AvatarUrl))
      .ForMember(d => d.Gender, opt => opt.MapFrom(s => s.User.Gender));

    CreateMap<Student, StudentDetailDto>()
      .ForMember(d => d.FullName, opt => opt.MapFrom(s => s.User.FullName))
      .ForMember(d => d.Email, opt => opt.MapFrom(s => s.User.Email))
      .ForMember(d => d.AvatarUrl, opt => opt.MapFrom(s => s.User.AvatarUrl))
      .ForMember(d => d.Gender, opt => opt.MapFrom(s => s.User.Gender));

    CreateMap<UpdateStudentDto, Student>()
      .ForMember(d => d.UserId, opt => opt.Ignore())
      .ForMember(d => d.User, opt => opt.Ignore())
      .ForMember(d => d.AddressId, opt => opt.Ignore())
      .ForMember(d => d.Address, opt => opt.Ignore())
      .ForMember(d => d.Id, opt => opt.Ignore())
      .ForMember(d => d.CreatedAt, opt => opt.Ignore())
      .ForMember(d => d.UpdatedAt, opt => opt.Ignore())
      .ForMember(d => d.IsDeleted, opt => opt.Ignore());
  }
}
