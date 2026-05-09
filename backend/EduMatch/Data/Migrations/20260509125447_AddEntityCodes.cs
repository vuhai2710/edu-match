using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduMatch.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEntityCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: Add columns as nullable
            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "TutorRequests",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "TutorProfiles",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "StudentProfiles",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "Classes",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            // Step 2: Backfill existing records
            migrationBuilder.Sql("UPDATE \"StudentProfiles\" SET \"Code\" = 'STU' || LPAD(\"Id\"::text, 5, '0') WHERE \"Code\" IS NULL;");
            migrationBuilder.Sql("UPDATE \"TutorProfiles\" SET \"Code\" = 'TUT' || LPAD(\"Id\"::text, 5, '0') WHERE \"Code\" IS NULL;");
            migrationBuilder.Sql("UPDATE \"TutorRequests\" SET \"Code\" = 'REQ' || LPAD(\"Id\"::text, 5, '0') WHERE \"Code\" IS NULL;");
            migrationBuilder.Sql("UPDATE \"Classes\" SET \"Code\" = 'CLS' || LPAD(\"Id\"::text, 5, '0') WHERE \"Code\" IS NULL;");

            // Step 3: Alter columns to not null
            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "TutorRequests",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "TutorProfiles",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "StudentProfiles",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "Classes",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TutorRequests_Code",
                table: "TutorRequests",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TutorProfiles_Code",
                table: "TutorProfiles",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudentProfiles_Code",
                table: "StudentProfiles",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Classes_Code",
                table: "Classes",
                column: "Code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TutorRequests_Code",
                table: "TutorRequests");

            migrationBuilder.DropIndex(
                name: "IX_TutorProfiles_Code",
                table: "TutorProfiles");

            migrationBuilder.DropIndex(
                name: "IX_StudentProfiles_Code",
                table: "StudentProfiles");

            migrationBuilder.DropIndex(
                name: "IX_Classes_Code",
                table: "Classes");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "TutorRequests");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "TutorProfiles");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "StudentProfiles");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "Classes");
        }
    }
}
