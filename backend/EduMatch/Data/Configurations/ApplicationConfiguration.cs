using EduMatch.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduMatch.Data.Configurations
{
  public class ApplicationConfiguration : IEntityTypeConfiguration<Application>
  {
    public void Configure(EntityTypeBuilder<Application> builder)
    {
      builder.HasQueryFilter(x => !x.IsDeleted);

      builder.HasIndex(x => new { x.TutorProfileId, x.TutorRequestId })
        .IsUnique();

      builder.Property(x => x.Message)
        .HasMaxLength(1000)
        .IsRequired(false);

      builder.Property(x => x.Status)
        .HasConversion<string>()
        .HasMaxLength(20)
        .IsRequired();

      builder.HasOne(x => x.Tutor)
        .WithMany(x => x.Applications)
        .HasForeignKey(x => x.TutorProfileId)
        .OnDelete(DeleteBehavior.Cascade);

      builder.HasOne(x => x.TutorRequest)
        .WithMany(x => x.Applications)
        .HasForeignKey(x => x.TutorRequestId)
        .OnDelete(DeleteBehavior.Cascade);
    }
  }
}
