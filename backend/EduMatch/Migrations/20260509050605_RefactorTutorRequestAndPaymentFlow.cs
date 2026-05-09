using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduMatch.Migrations
{
    /// <inheritdoc />
    public partial class RefactorTutorRequestAndPaymentFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AgreedPrice",
                table: "Classes");

            migrationBuilder.DropColumn(
                name: "TotalSessions",
                table: "Classes");

            migrationBuilder.RenameColumn(
                name: "BudgetMax",
                table: "TutorRequests",
                newName: "PricePerSession");

            migrationBuilder.AlterColumn<int>(
                name: "SessionsPerWeek",
                table: "TutorRequests",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "MinutesPerSession",
                table: "TutorRequests",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DepositAmount",
                table: "Applications",
                type: "numeric(18,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DepositAmount",
                table: "Applications");

            migrationBuilder.RenameColumn(
                name: "PricePerSession",
                table: "TutorRequests",
                newName: "BudgetMax");

            migrationBuilder.AlterColumn<int>(
                name: "SessionsPerWeek",
                table: "TutorRequests",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<int>(
                name: "MinutesPerSession",
                table: "TutorRequests",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<decimal>(
                name: "AgreedPrice",
                table: "Classes",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "TotalSessions",
                table: "Classes",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
