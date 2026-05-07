using EduMatch.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduMatch.Data.Configurations
{
  public class SubjectConfiguration : IEntityTypeConfiguration<Subject>
  {
    public void Configure(EntityTypeBuilder<Subject> builder)
    {
      builder.HasQueryFilter(e => !e.IsDeleted);

      builder.Property(x => x.Name)
        .HasMaxLength(100)
        .IsRequired();

      builder.HasIndex(x => x.Name)
        .IsUnique();

      builder.Property(x => x.Description)
        .HasMaxLength(500)
        .IsRequired(false);

      builder.HasMany(x => x.TutorSubjects)
        .WithOne(x => x.Subject)
        .HasForeignKey(x => x.SubjectId)
        .OnDelete(DeleteBehavior.Restrict);
    }
  }
}
