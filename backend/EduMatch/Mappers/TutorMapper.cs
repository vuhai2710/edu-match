using AutoMapper;
using EduMatch.DTOs.Tutor;
using EduMatch.Models;

namespace EduMatch.Mappers;

public class TutorMapper : Profile
{
  public TutorMapper()
  {
    CreateMap<Tutor, TutorDto>()
      .ForMember(d => d.FullName, opt => opt.MapFrom(s => s.User != null ? s.User.FullName : string.Empty))
      .ForMember(d => d.AvatarUrl, opt => opt.MapFrom(s => s.User != null && s.User.AvatarFile != null ? s.User.AvatarFile.FilePath : null))
      .ForMember(d => d.Subjects, opt => opt.MapFrom(s => s.TutorSubjects));

    CreateMap<Tutor, TutorDetailDto>()
      .ForMember(d => d.FullName, opt => opt.MapFrom(s => s.User != null ? s.User.FullName : string.Empty))
      .ForMember(d => d.Email, opt => opt.MapFrom(s => s.User != null ? s.User.Email : string.Empty))
      .ForMember(d => d.AvatarUrl, opt => opt.MapFrom(s => s.User != null && s.User.AvatarFile != null ? s.User.AvatarFile.FilePath : null))
      .ForMember(d => d.CvUrl, opt => opt.MapFrom(s => s.CvFile != null ? s.CvFile.FilePath : null))
      .ForMember(d => d.Subjects, opt => opt.MapFrom(s => s.TutorSubjects));

    CreateMap<TutorSubject, TutorSubjectDto>()
      .ForMember(d => d.SubjectName, opt => opt.MapFrom(s => s.Subject != null ? s.Subject.Name : string.Empty));

    CreateMap<UpdateTutorDto, Tutor>()
      .ForMember(d => d.UserId, opt => opt.Ignore())
      .ForMember(d => d.Rating, opt => opt.Ignore())
      .ForMember(d => d.TotalReviews, opt => opt.Ignore())
      .ForMember(d => d.ApprovalStatus, opt => opt.Ignore())
      .ForMember(d => d.User, opt => opt.Ignore())
      .ForMember(d => d.TutorSubjects, opt => opt.Ignore())
      .ForMember(d => d.Applications, opt => opt.Ignore())
      .ForMember(d => d.AddressId, opt => opt.Ignore())
      .ForMember(d => d.Address, opt => opt.Ignore())
      .ForMember(d => d.Id, opt => opt.Ignore())
      .ForMember(d => d.CreatedAt, opt => opt.Ignore())
      .ForMember(d => d.UpdatedAt, opt => opt.Ignore())
      .ForMember(d => d.IsDeleted, opt => opt.Ignore());
  }
}
