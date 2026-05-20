using AutoMapper;
using EduMatch.DTOs.Subject;
using EduMatch.Models;

namespace EduMatch.Mappers
{
  public class SubjectMapper : Profile
  {
    public SubjectMapper()
    {
      CreateMap<Subject, SubjectResponseDto>();
      CreateMap<SubjectDto, Subject>();
    }
  }
}
