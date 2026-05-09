using EduMatch.Services.Interfaces;

namespace EduMatch.Services
{
    public class CodeGeneratorService : ICodeGeneratorService
    {
        public string GenerateStudentCode(long id) => $"STU{id:D5}";
        public string GenerateTutorCode(long id) => $"TUT{id:D5}";
        public string GenerateClassRequestCode(long id) => $"REQ{id:D5}";
        public string GenerateClassCode(long id) => $"CLS{id:D5}";
    }
}
