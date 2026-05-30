using EduMatch.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduMatch.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260530000100_AddClassTimeSlotsJsonbGinIndex")]
    public partial class AddClassTimeSlotsJsonbGinIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE INDEX "IX_Classes_TimeSlotsJson"
                ON "Classes" USING GIN ("TimeSlotsJson" jsonb_path_ops)
                WHERE "TimeSlotsJson" IS NOT NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DROP INDEX IF EXISTS "IX_Classes_TimeSlotsJson";
                """);
        }
    }
}
