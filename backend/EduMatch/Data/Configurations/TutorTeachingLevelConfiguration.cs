using EduMatch.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduMatch.Data.Configurations
{
  public class TutorTeachingLevelConfiguration : IEntityTypeConfiguration<TutorTeachingLevel>
  {
    public void Configure(EntityTypeBuilder<TutorTeachingLevel> builder)
    {
      builder.HasQueryFilter(e => !e.IsDeleted);

      builder.HasIndex(x => new { x.TutorId, x.TeachingLevel }).IsUnique();

      builder.Property(x => x.TeachingLevel)
        .HasConversion<string>()
        .HasMaxLength(50)
        .IsRequired();

      builder.HasOne(x => x.Tutor)
        .WithMany(x => x.TeachingLevels)
        .HasForeignKey(x => x.TutorId)
        .OnDelete(DeleteBehavior.Cascade);
    }
  }
}
