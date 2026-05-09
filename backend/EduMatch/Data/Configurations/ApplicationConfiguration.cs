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

      builder.HasIndex(x => new { TutorProfileId = x.TutorId, x.TutorRequestId })
        .IsUnique();

      builder.Property(x => x.Message)
        .HasMaxLength(1000)
        .IsRequired(false);

      builder.Property(x => x.Status)
        .HasConversion<string>()
        .HasMaxLength(32)
        .IsRequired();

      builder.Property(x => x.StudentAcceptedMatch)
        .HasDefaultValue(false)
        .IsRequired();

      builder.Property(x => x.TutorAcceptedMatch)
        .HasDefaultValue(false)
        .IsRequired();

      builder.Property(x => x.DepositAmount)
        .HasColumnType("decimal(18,2)")
        .IsRequired(false);

      builder.HasOne(x => x.Tutor)
        .WithMany(x => x.Applications)
        .HasForeignKey(x => x.TutorId)
        .OnDelete(DeleteBehavior.Cascade);

      builder.HasOne(x => x.TutorRequest)
        .WithMany(x => x.Applications)
        .HasForeignKey(x => x.TutorRequestId)
        .OnDelete(DeleteBehavior.Cascade);
    }
  }
}
