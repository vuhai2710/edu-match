using File = EduMatch.Models.File;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduMatch.Data.Configurations
{
  public class FileConfiguration : IEntityTypeConfiguration<File>
  {
    public void Configure(EntityTypeBuilder<File> builder)
    {
      builder.ToTable("Files");
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
    }
  }
}
