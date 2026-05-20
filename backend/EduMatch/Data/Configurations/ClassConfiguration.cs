using EduMatch.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduMatch.Data.Configurations
{
  public class ClassConfiguration : IEntityTypeConfiguration<Class>
  {
    public void Configure(EntityTypeBuilder<Class> builder)
    {

      builder.HasQueryFilter(x => !x.IsDeleted);

      builder.HasKey(c => c.Id);
      builder.Property(x => x.Code).IsRequired().HasMaxLength(20);
      builder.HasIndex(x => x.Code).IsUnique();

      builder.HasOne(c => c.Student)
          .WithMany()
          .HasForeignKey(c => c.StudentId)
          .OnDelete(DeleteBehavior.Restrict);

      builder.HasOne(c => c.Tutor)
          .WithMany()
          .HasForeignKey(c => c.TutorId)
          .OnDelete(DeleteBehavior.Restrict);

      builder.HasOne(c => c.Request)
          .WithMany()
          .HasForeignKey(c => c.RequestId)
          .OnDelete(DeleteBehavior.Restrict);

      builder.HasOne(c => c.Application)
          .WithMany()
          .HasForeignKey(c => c.ApplicationId)
          .OnDelete(DeleteBehavior.Restrict);

      builder.Property(c => c.DepositAmount)
          .HasColumnType("decimal(18,2)");

      builder.Property(c => c.Status)
          .HasConversion<string>()
          .IsRequired()
          .HasMaxLength(50);
    }
  }
}