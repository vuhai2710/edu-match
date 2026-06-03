using EduMatch.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduMatch.Data.Configurations;

public class ClassCompletionRequestConfiguration : IEntityTypeConfiguration<ClassCompletionRequest>
{
  public void Configure(EntityTypeBuilder<ClassCompletionRequest> builder)
  {
    builder.HasQueryFilter(x => !x.IsDeleted);

    builder.HasKey(x => x.Id);

    builder.Property(x => x.RequestedByRole)
      .HasConversion<string>()
      .HasMaxLength(20)
      .IsRequired();

    builder.Property(x => x.Status)
      .HasConversion<string>()
      .HasMaxLength(20)
      .IsRequired();

    builder.Property(x => x.RespondedByRole)
      .HasConversion<string>()
      .HasMaxLength(20);

    builder.HasOne(x => x.Class)
      .WithMany()
      .HasForeignKey(x => x.ClassId)
      .OnDelete(DeleteBehavior.Restrict);

    builder.HasOne(x => x.RequestedByUser)
      .WithMany()
      .HasForeignKey(x => x.RequestedByUserId)
      .OnDelete(DeleteBehavior.Restrict);

    builder.HasOne(x => x.RespondedByUser)
      .WithMany()
      .HasForeignKey(x => x.RespondedByUserId)
      .OnDelete(DeleteBehavior.Restrict);

    builder.HasIndex(x => new { x.ClassId, x.Status });
  }
}
