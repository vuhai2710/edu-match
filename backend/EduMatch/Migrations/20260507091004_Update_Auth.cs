using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduMatch.Migrations
{
    /// <inheritdoc />
    public partial class Update_Auth : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsGoogleAccount",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsGoogleAccount",
                table: "Users");
        }
    }
}
