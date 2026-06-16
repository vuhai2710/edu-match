using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using File = EduMatch.Models.File;

namespace EduMatch.Data.Configurations
{
  public class FileConfiguration : IEntityTypeConfiguration<File>
  {
    public void Configure(EntityTypeBuilder<File> builder)
    {
      builder.HasQueryFilter(e => !e.IsDeleted);

      builder.Property(x => x.FileName)
        .HasMaxLength(255)
        .IsRequired();

      builder.Property(x => x.FileSize)
        .IsRequired();

      builder.Property(x => x.ContentType)
        .HasMaxLength(150)
        .IsRequired();

      builder.Property(x => x.FileType)
        .HasMaxLength(20)
        .IsRequired();

      builder.Property(x => x.FilePath)
        .IsRequired();

      builder.Property(x => x.UploadToken)
        .HasMaxLength(128)
        .IsRequired(false);

      builder.HasIndex(x => x.UploadToken);

      builder.HasIndex(x => new { x.IsTemporary, x.ExpiresAt });
    }
  }
}
