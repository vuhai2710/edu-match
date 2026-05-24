using EduMatch.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduMatch.Migrations
{
  [DbContext(typeof(AppDbContext))]
  [Migration("20260524010000_RenameTutorBioToProfile")]
  public partial class RenameTutorBioToProfile : Migration
  {
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql(
        """
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'Tutors'
              AND column_name = 'Bio'
          ) AND NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'Tutors'
              AND column_name = 'Profile'
          ) THEN
            ALTER TABLE "Tutors" RENAME COLUMN "Bio" TO "Profile";
          END IF;
        END $$;
        """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql(
        """
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'Tutors'
              AND column_name = 'Profile'
          ) AND NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'Tutors'
              AND column_name = 'Bio'
          ) THEN
            ALTER TABLE "Tutors" RENAME COLUMN "Profile" TO "Bio";
          END IF;
        END $$;
        """);
    }
  }
}
