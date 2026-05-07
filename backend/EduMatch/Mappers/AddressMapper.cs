using AutoMapper;
using EduMatch.DTOs.Address;
using EduMatch.Models;

namespace EduMatch.Mappers
{
  public class AddressMapper : Profile
  {
    public AddressMapper()
    {
      CreateMap<Address, AddressDto>();
      
      CreateMap<CreateAddressDto, Address>()
        .ForMember(d => d.Id, opt => opt.Ignore())
        .ForMember(d => d.CreatedAt, opt => opt.Ignore())
        .ForMember(d => d.UpdatedAt, opt => opt.Ignore())
        .ForMember(d => d.IsDeleted, opt => opt.Ignore())
        .ForMember(d => d.DistrictId, opt => opt.MapFrom(_ => 0))
        .ForMember(d => d.DistrictName, opt => opt.MapFrom(_ => string.Empty))
        .ForMember(d => d.FullAddress, opt => opt.MapFrom(s => string.Join(", ", new[] { s.AddressDetail, s.WardName, s.ProvinceName }.Where(p => !string.IsNullOrWhiteSpace(p)))));
    }
  }
}
