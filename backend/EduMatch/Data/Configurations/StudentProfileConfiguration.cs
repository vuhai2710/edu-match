using EduMatch.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduMatch.Data.Configurations
{
  public class StudentProfileConfiguration : IEntityTypeConfiguration<Student>
  {
    public void Configure(EntityTypeBuilder<Student> builder)
    {
      builder.HasKey(s => s.Id);

      builder.HasOne(s => s.User)
          .WithOne(u => u.StudentProfile)
          .HasForeignKey<Student>(s => s.UserId)
          .OnDelete(DeleteBehavior.Cascade);

      builder.HasQueryFilter(s => !s.IsDeleted);
    }
  }
}
