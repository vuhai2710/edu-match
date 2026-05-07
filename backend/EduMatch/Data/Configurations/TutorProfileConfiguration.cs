using EduMatch.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduMatch.Data.Configurations
{
  public class TutorProfileConfiguration : IEntityTypeConfiguration<Tutor>
  {
    public void Configure(EntityTypeBuilder<Tutor> builder)
    {
      builder.HasQueryFilter(e => !e.IsDeleted);

      builder.Property(x => x.Bio)
        .HasMaxLength(2000)
        .IsRequired(false);

      builder.Property(x => x.HourlyRate)
        .HasColumnType("decimal(18,2)")
        .IsRequired();

      builder.Property(x => x.Rating)
        .HasDefaultValue(0.0)
        .IsRequired();

      builder.Property(x => x.TotalReviews)
        .HasDefaultValue(0)
        .IsRequired();

      builder.Property(x => x.ApprovalStatus)
        .HasConversion<string>()
        .HasMaxLength(20)
        .IsRequired();

      builder.HasOne(x => x.User)
        .WithOne(u => u.TutorProfile)
        .HasForeignKey<Tutor>(x => x.UserId)
        .IsRequired()
        .OnDelete(DeleteBehavior.Cascade);

      builder.HasMany(x => x.TutorSubjects)
        .WithOne(x => x.Tutor)
        .HasForeignKey(x => x.TutorProfileId)
        .OnDelete(DeleteBehavior.Cascade);

      builder.HasMany(x => x.Applications)
        .WithOne(x => x.Tutor)
        .HasForeignKey(x => x.TutorProfileId)
        .OnDelete(DeleteBehavior.Cascade);
    }
  }
}
