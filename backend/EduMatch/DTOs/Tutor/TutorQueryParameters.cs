using EduMatch.Enums;

namespace EduMatch.DTOs.Tutor
{
    public class TutorQueryParameters : BaseQueryParameters
    {
        public long? SubjectId { get; set; }
        public int? ProvinceId { get; set; }
        public string? WardCode { get; set; }
    }
}
