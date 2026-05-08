using EduMatch.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduMatch.Data.Configurations
{
  public class UserConfiguration : IEntityTypeConfiguration<User>
  {
    public void Configure(EntityTypeBuilder<User> builder)
    {
      builder.HasQueryFilter(e => !e.IsDeleted);

      builder.HasIndex(u => u.Email).IsUnique();

      builder.HasIndex(u => u.PhoneNumber).IsUnique();

      builder.Property(u => u.Email).HasMaxLength(256).IsRequired();

      builder.Property(u => u.PhoneNumber).HasMaxLength(10);

      builder.Property(u => u.FullName).HasMaxLength(100).IsRequired();

      builder.Property(u => u.Password).IsRequired();

      builder.Property(u => u.Role).HasConversion<string>();

      builder.Property(u => u.Gender).HasConversion<string>();

      builder.HasOne(u => u.AvatarFile)
        .WithOne()
        .HasForeignKey<User>(u => u.AvatarFileId)
        .IsRequired(false)
        .OnDelete(DeleteBehavior.NoAction);
    }
  }
}
