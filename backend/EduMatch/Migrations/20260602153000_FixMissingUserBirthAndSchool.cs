using EduMatch.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduMatch.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260602153000_FixMissingUserBirthAndSchool")]
    public partial class FixMissingUserBirthAndSchool : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "Users"
                ADD COLUMN IF NOT EXISTS "Birth" integer;

                ALTER TABLE "Users"
                ADD COLUMN IF NOT EXISTS "School" character varying(255);

                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = current_schema()
                          AND table_name = 'Students'
                          AND column_name = 'School'
                    ) THEN
                        EXECUTE '
                            UPDATE "Users" AS u
                            SET "School" = s."School"
                            FROM "Students" AS s
                            WHERE s."UserId" = u."Id"
                              AND s."School" IS NOT NULL
                              AND s."School" <> ''''
                              AND (u."School" IS NULL OR u."School" = '''')';

                        EXECUTE 'ALTER TABLE "Students" DROP COLUMN "School"';
                    END IF;
                END $$;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "Students"
                ADD COLUMN IF NOT EXISTS "School" text NOT NULL DEFAULT '';

                UPDATE "Students" AS s
                SET "School" = COALESCE(u."School", '')
                FROM "Users" AS u
                WHERE s."UserId" = u."Id";

                ALTER TABLE "Users"
                DROP COLUMN IF EXISTS "Birth";

                ALTER TABLE "Users"
                DROP COLUMN IF EXISTS "School";
                """);
        }
    }
}
