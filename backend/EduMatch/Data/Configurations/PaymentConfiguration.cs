using EduMatch.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduMatch.Data.Configurations
{
  public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
  {
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
      builder.HasQueryFilter(x => !x.IsDeleted);

      builder.HasKey(p => p.Id);

      builder.HasOne(p => p.Tutor)
          .WithMany()
          .HasForeignKey(p => p.TutorId)
          .OnDelete(DeleteBehavior.Restrict);

      builder.HasOne(p => p.Class)
          .WithMany()
          .HasForeignKey(p => p.ClassId)
          .OnDelete(DeleteBehavior.Restrict);

      builder.Property(p => p.Amount)
          .HasColumnType("decimal(18,2)");

      builder.Property(p => p.Status)
          .HasConversion<string>()
          .IsRequired()
          .HasMaxLength(50);

      builder.Property(p => p.Description)
          .HasMaxLength(255);
    }
  }
}