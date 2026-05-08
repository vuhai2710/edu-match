using EduMatch.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduMatch.Data.Configurations
{
  public class TutorSubjectConfiguration : IEntityTypeConfiguration<TutorSubject>
  {
    public void Configure(EntityTypeBuilder<TutorSubject> builder)
    {
      builder.HasQueryFilter(e => !e.IsDeleted);

      builder.HasIndex(x => new { TutorProfileId = x.TutorId, x.SubjectId })
        .IsUnique();

      builder.Property(x => x.Level)
        .HasConversion<string>()
        .HasMaxLength(20)
        .IsRequired();

      builder.HasOne(x => x.Tutor)
        .WithMany(x => x.TutorSubjects)
        .HasForeignKey(x => x.TutorId)
        .OnDelete(DeleteBehavior.Cascade);

      builder.HasOne(x => x.Subject)
        .WithMany(x => x.TutorSubjects)
        .HasForeignKey(x => x.SubjectId)
        .OnDelete(DeleteBehavior.Restrict);
    }
  }
}
