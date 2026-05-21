using EduMatch.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduMatch.Data.Configurations
{
  public class LearningRequestConfiguration : IEntityTypeConfiguration<LearningRequest>
  {
    public void Configure(EntityTypeBuilder<LearningRequest> builder)
    {
      builder.HasQueryFilter(x => !x.IsDeleted);

      builder.Property(x => x.Note)
        .HasMaxLength(1000)
        .IsRequired(false);

      builder.Property(x => x.TimeSlots)
        .HasColumnType("jsonb")
        .IsRequired();

      builder.Property(x => x.HoursPerSession)
        .HasColumnType("decimal(5,2)")
        .IsRequired();

      builder.Property(x => x.BudgetPerHour)
        .HasColumnType("decimal(18,2)")
        .IsRequired();

      builder.Property(x => x.CalculatedDepositAmount)
        .HasColumnType("decimal(18,2)")
        .IsRequired();

      builder.Property(x => x.Status)
        .HasConversion<string>()
        .HasMaxLength(32)
        .IsRequired();

      builder.Property(x => x.PaymentExpiresAt)
        .IsRequired(false);

      builder.HasIndex(x => x.StudentId);
      builder.HasIndex(x => x.TutorProfileId);
      builder.HasIndex(x => x.Status);

      builder.HasOne(x => x.Student)
        .WithMany()
        .HasForeignKey(x => x.StudentId)
        .OnDelete(DeleteBehavior.Cascade);

      builder.HasOne(x => x.TutorProfile)
        .WithMany()
        .HasForeignKey(x => x.TutorProfileId)
        .OnDelete(DeleteBehavior.Restrict);

      builder.HasOne(x => x.Subject)
        .WithMany()
        .HasForeignKey(x => x.SubjectId)
        .OnDelete(DeleteBehavior.Restrict);
    }
  }
}
