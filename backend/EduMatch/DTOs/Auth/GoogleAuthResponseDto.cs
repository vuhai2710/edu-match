using EduMatch.DTOs.User;

namespace EduMatch.DTOs.Auth
{
    public class GoogleAuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public UserDto User { get; set; } = null!;
    }
}
