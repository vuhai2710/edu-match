using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduMatch.Data.Migrations
{
    /// <inheritdoc />
    public partial class ConvertGradeLevelToEnum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"TutorRequests\" ALTER COLUMN \"GradeLevel\" TYPE integer USING NULL;");
            migrationBuilder.Sql("ALTER TABLE \"StudentProfiles\" ALTER COLUMN \"GradeLevel\" DROP NOT NULL;");
            migrationBuilder.Sql("ALTER TABLE \"StudentProfiles\" ALTER COLUMN \"GradeLevel\" TYPE integer USING NULL;");

            migrationBuilder.AlterColumn<int>(
                name: "GradeLevel",
                table: "TutorRequests",
                type: "integer",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "GradeLevel",
                table: "StudentProfiles",
                type: "integer",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "GradeLevel",
                table: "TutorRequests",
                type: "text",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "GradeLevel",
                table: "StudentProfiles",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
        }
    }
}
