using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduMatch.Migrations
{
    /// <inheritdoc />
    public partial class AddV2PaymentAndClassFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<long>(
                name: "TutorId",
                table: "Payments",
                type: "bigint",
                nullable: true,
                oldClrType: typeof(long),
                oldType: "bigint");

            migrationBuilder.AlterColumn<long>(
                name: "ClassId",
                table: "Payments",
                type: "bigint",
                nullable: true,
                oldClrType: typeof(long),
                oldType: "bigint");

            migrationBuilder.AlterColumn<string>(
                name: "CheckoutUrl",
                table: "Payments",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<long>(
                name: "LearningRequestId",
                table: "Payments",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "PaidByUserId",
                table: "Payments",
                type: "bigint",
                nullable: true);

            migrationBuilder.AlterColumn<long>(
                name: "RequestId",
                table: "Classes",
                type: "bigint",
                nullable: true,
                oldClrType: typeof(long),
                oldType: "bigint");

            migrationBuilder.AlterColumn<long>(
                name: "ApplicationId",
                table: "Classes",
                type: "bigint",
                nullable: true,
                oldClrType: typeof(long),
                oldType: "bigint");

            migrationBuilder.AddColumn<long>(
                name: "AcceptedScheduleProposalId",
                table: "Classes",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AcceptedScheduleSource",
                table: "Classes",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DepositAmountSnapshot",
                table: "Classes",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "LearningRequestId",
                table: "Classes",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "SubjectId",
                table: "Classes",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TimeSlotsJson",
                table: "Classes",
                type: "jsonb",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_LearningRequestId",
                table: "Payments",
                column: "LearningRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_PaidByUserId",
                table: "Payments",
                column: "PaidByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Classes_AcceptedScheduleProposalId",
                table: "Classes",
                column: "AcceptedScheduleProposalId");

            migrationBuilder.CreateIndex(
                name: "IX_Classes_LearningRequestId",
                table: "Classes",
                column: "LearningRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_Classes_SubjectId",
                table: "Classes",
                column: "SubjectId");

            migrationBuilder.AddForeignKey(
                name: "FK_Classes_LearningRequests_LearningRequestId",
                table: "Classes",
                column: "LearningRequestId",
                principalTable: "LearningRequests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Classes_ScheduleProposals_AcceptedScheduleProposalId",
                table: "Classes",
                column: "AcceptedScheduleProposalId",
                principalTable: "ScheduleProposals",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Classes_Subjects_SubjectId",
                table: "Classes",
                column: "SubjectId",
                principalTable: "Subjects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_LearningRequests_LearningRequestId",
                table: "Payments",
                column: "LearningRequestId",
                principalTable: "LearningRequests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Users_PaidByUserId",
                table: "Payments",
                column: "PaidByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Classes_LearningRequests_LearningRequestId",
                table: "Classes");

            migrationBuilder.DropForeignKey(
                name: "FK_Classes_ScheduleProposals_AcceptedScheduleProposalId",
                table: "Classes");

            migrationBuilder.DropForeignKey(
                name: "FK_Classes_Subjects_SubjectId",
                table: "Classes");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_LearningRequests_LearningRequestId",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Users_PaidByUserId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_LearningRequestId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_PaidByUserId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Classes_AcceptedScheduleProposalId",
                table: "Classes");

            migrationBuilder.DropIndex(
                name: "IX_Classes_LearningRequestId",
                table: "Classes");

            migrationBuilder.DropIndex(
                name: "IX_Classes_SubjectId",
                table: "Classes");

            migrationBuilder.DropColumn(
                name: "LearningRequestId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "PaidByUserId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "AcceptedScheduleProposalId",
                table: "Classes");

            migrationBuilder.DropColumn(
                name: "AcceptedScheduleSource",
                table: "Classes");

            migrationBuilder.DropColumn(
                name: "DepositAmountSnapshot",
                table: "Classes");

            migrationBuilder.DropColumn(
                name: "LearningRequestId",
                table: "Classes");

            migrationBuilder.DropColumn(
                name: "SubjectId",
                table: "Classes");

            migrationBuilder.DropColumn(
                name: "TimeSlotsJson",
                table: "Classes");

            migrationBuilder.AlterColumn<long>(
                name: "TutorId",
                table: "Payments",
                type: "bigint",
                nullable: false,
                defaultValue: 0L,
                oldClrType: typeof(long),
                oldType: "bigint",
                oldNullable: true);

            migrationBuilder.AlterColumn<long>(
                name: "ClassId",
                table: "Payments",
                type: "bigint",
                nullable: false,
                defaultValue: 0L,
                oldClrType: typeof(long),
                oldType: "bigint",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CheckoutUrl",
                table: "Payments",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<long>(
                name: "RequestId",
                table: "Classes",
                type: "bigint",
                nullable: false,
                defaultValue: 0L,
                oldClrType: typeof(long),
                oldType: "bigint",
                oldNullable: true);

            migrationBuilder.AlterColumn<long>(
                name: "ApplicationId",
                table: "Classes",
                type: "bigint",
                nullable: false,
                defaultValue: 0L,
                oldClrType: typeof(long),
                oldType: "bigint",
                oldNullable: true);
        }
    }
}
