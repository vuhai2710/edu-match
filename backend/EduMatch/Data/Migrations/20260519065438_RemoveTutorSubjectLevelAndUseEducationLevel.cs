using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduMatch.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTutorSubjectLevelAndUseEducationLevel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Level",
                table: "TutorSubjects");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Level",
                table: "TutorSubjects",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");
        }
    }
}
