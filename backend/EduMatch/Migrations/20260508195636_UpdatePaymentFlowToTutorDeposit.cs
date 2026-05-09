using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduMatch.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePaymentFlowToTutorDeposit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Users_StudentId",
                table: "Payments");

            migrationBuilder.RenameColumn(
                name: "StudentId",
                table: "Payments",
                newName: "TutorId");

            migrationBuilder.RenameIndex(
                name: "IX_Payments_StudentId",
                table: "Payments",
                newName: "IX_Payments_TutorId");

            migrationBuilder.AddColumn<decimal>(
                name: "DepositAmount",
                table: "Classes",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_TutorProfiles_TutorId",
                table: "Payments",
                column: "TutorId",
                principalTable: "TutorProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_TutorProfiles_TutorId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "DepositAmount",
                table: "Classes");

            migrationBuilder.RenameColumn(
                name: "TutorId",
                table: "Payments",
                newName: "StudentId");

            migrationBuilder.RenameIndex(
                name: "IX_Payments_TutorId",
                table: "Payments",
                newName: "IX_Payments_StudentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Users_StudentId",
                table: "Payments",
                column: "StudentId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
