using EduMatch.Common.Enums;

namespace EduMatch.DTOs.Auth
{
    public class GoogleLoginRequestDto
    {
        public string IdToken { get; set; } = string.Empty;
        public string AccessToken { get; set; } = string.Empty;
        public UserRole? RequestedRole { get; set; }
        public bool RegistrationIntent { get; set; }
    }
}
