using EduMatch.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduMatch.Data.Configurations
{
  public class ReviewConfiguration : IEntityTypeConfiguration<Review>
  {
    public void Configure(EntityTypeBuilder<Review> builder)
    {
      builder.HasQueryFilter(x => !x.IsDeleted);

      builder.HasKey(r => r.Id);
      builder.HasIndex(r => r.ClassId).IsUnique();

      builder.Property(r => r.Rating).IsRequired();
      builder.Property(r => r.Comment).HasMaxLength(1000);

      builder.HasOne(r => r.Class)
        .WithMany()
        .HasForeignKey(r => r.ClassId)
        .OnDelete(DeleteBehavior.Restrict);

      builder.HasOne(r => r.Student)
        .WithMany()
        .HasForeignKey(r => r.StudentId)
        .OnDelete(DeleteBehavior.Restrict);

      builder.HasOne(r => r.Tutor)
        .WithMany()
        .HasForeignKey(r => r.TutorId)
        .OnDelete(DeleteBehavior.Restrict);
    }
  }
}
