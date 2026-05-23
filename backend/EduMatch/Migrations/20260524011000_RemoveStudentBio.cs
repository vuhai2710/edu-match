using EduMatch.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduMatch.Migrations
{
  [DbContext(typeof(AppDbContext))]
  [Migration("20260524011000_RemoveStudentBio")]
  public partial class RemoveStudentBio : Migration
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
              AND table_name = 'Students'
              AND column_name = 'Bio'
          ) THEN
            ALTER TABLE "Students" DROP COLUMN "Bio";
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
          IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'Students'
              AND column_name = 'Bio'
          ) THEN
            ALTER TABLE "Students" ADD COLUMN "Bio" text NOT NULL DEFAULT '';
          END IF;
        END $$;
        """);
    }
  }
}
