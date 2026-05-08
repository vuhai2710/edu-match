using EduMatch.Enums;

namespace EduMatch.DTOs.User
{
    public class UserQueryParameters : BaseQueryParameters
    {
        public UserRole? Role { get; set; }
        public bool? IsActive { get; set; }
    }
}
