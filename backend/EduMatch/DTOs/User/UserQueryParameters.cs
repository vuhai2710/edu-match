using EduMatch.Common.Enums;
using Microsoft.AspNetCore.Mvc;

namespace EduMatch.DTOs.User
{
    public class UserQueryParameters : BaseQueryParameters
    {
        [FromQuery(Name = "role")]
        public UserRole? Role { get; set; }

        [FromQuery(Name = "isActive")]
        public bool? IsActive { get; set; }

        [FromQuery(Name = "isDeleted")]
        public bool? IsDeleted { get; set; }

        [FromQuery(Name = "tutorApprovalStatus")]
        public TutorApprovalStatus? TutorApprovalStatus { get; set; }
    }
}
