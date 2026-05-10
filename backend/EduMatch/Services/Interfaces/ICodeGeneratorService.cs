namespace EduMatch.Services.Interfaces
{
    public interface ICodeGeneratorService
    {
        string GenerateTemporaryCode(string prefix);
        string GenerateStudentCode(long id);
        string GenerateTutorCode(long id);
        string GenerateClassRequestCode(long id);
        string GenerateClassCode(long id);
    }
}
