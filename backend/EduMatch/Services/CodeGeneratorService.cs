using EduMatch.Services.Interfaces;

namespace EduMatch.Services
{
    public class CodeGeneratorService : ICodeGeneratorService
    {
        public string GenerateTemporaryCode(string prefix)
        {
            var normalizedPrefix = string.IsNullOrWhiteSpace(prefix)
                ? string.Empty
                : prefix.Trim().ToUpperInvariant();
            var maxSuffixLength = Math.Max(1, 20 - normalizedPrefix.Length);
            var suffix = Guid.NewGuid().ToString("N")[..maxSuffixLength].ToUpperInvariant();

            return $"{normalizedPrefix}{suffix}";
        }

        public string GenerateStudentCode(long id) => $"STU{id:D5}";
        public string GenerateTutorCode(long id) => $"TUT{id:D5}";
        public string GenerateClassRequestCode(long id) => $"REQ{id:D5}";
        public string GenerateClassCode(long id) => $"CLS{id:D5}";
    }
}
