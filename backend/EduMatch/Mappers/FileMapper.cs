using AutoMapper;
using EduMatch.DTOs;
using FileEntity = EduMatch.Models.File;

namespace EduMatch.Mappers
{
  public class FileMapper : Profile
  {
    public FileMapper()
    {
      CreateMap<FileEntity, FileDto>();
    }
  }
}
