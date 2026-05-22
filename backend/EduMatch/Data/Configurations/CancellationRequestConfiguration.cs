using EduMatch.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduMatch.Data.Configurations
{
  public class CancellationRequestConfiguration : IEntityTypeConfiguration<CancellationRequest>
  {
    public void Configure(EntityTypeBuilder<CancellationRequest> builder)
    {
      builder.HasQueryFilter(x => !x.IsDeleted);

      builder.HasKey(x => x.Id);

      builder.Property(x => x.Reason)
        .IsRequired()
        .HasMaxLength(1000);

      builder.Property(x => x.Status)
        .HasConversion<string>()
        .IsRequired()
        .HasMaxLength(20);

      builder.Property(x => x.RequestedByRole)
        .HasConversion<string>()
        .IsRequired()
        .HasMaxLength(20);

      builder.Property(x => x.RefundAmount)
        .HasColumnType("decimal(18,2)");

      builder.Property(x => x.RefundNote)
        .HasMaxLength(1000);

      builder.HasIndex(x => new { x.ClassId, x.Status });

      builder.HasOne(x => x.Class)
        .WithMany()
        .HasForeignKey(x => x.ClassId)
        .OnDelete(DeleteBehavior.Restrict);

      builder.HasOne(x => x.RequestedByUser)
        .WithMany()
        .HasForeignKey(x => x.RequestedByUserId)
        .OnDelete(DeleteBehavior.Restrict);

      builder.HasOne(x => x.ResolvedByUser)
        .WithMany()
        .HasForeignKey(x => x.ResolvedByUserId)
        .OnDelete(DeleteBehavior.Restrict);
    }
  }
}
