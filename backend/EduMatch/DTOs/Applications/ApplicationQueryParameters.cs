using EduMatch.Common.Enums;
using Microsoft.AspNetCore.Mvc;

namespace EduMatch.DTOs.Applications
{
    public class ApplicationQueryParameters : BaseQueryParameters
    {
        [FromQuery(Name = "status")]
        public ApplicationStatus? Status { get; set; }
    }
}
