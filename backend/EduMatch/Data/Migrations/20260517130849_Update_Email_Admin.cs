using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduMatch.Data.Migrations
{
    /// <inheritdoc />
    public partial class Update_Email_Admin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Applications_TutorProfiles_TutorId",
                table: "Applications");

            migrationBuilder.DropForeignKey(
                name: "FK_Classes_TutorProfiles_TutorId",
                table: "Classes");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_TutorProfiles_TutorId",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_TutorProfiles_TutorId",
                table: "Reviews");

            migrationBuilder.DropForeignKey(
                name: "FK_StudentProfiles_Addresses_AddressId",
                table: "StudentProfiles");

            migrationBuilder.DropForeignKey(
                name: "FK_StudentProfiles_Users_UserId",
                table: "StudentProfiles");

            migrationBuilder.DropForeignKey(
                name: "FK_TutorProfiles_Addresses_AddressId",
                table: "TutorProfiles");

            migrationBuilder.DropForeignKey(
                name: "FK_TutorProfiles_Files_CvFileId",
                table: "TutorProfiles");

            migrationBuilder.DropForeignKey(
                name: "FK_TutorProfiles_Users_UserId",
                table: "TutorProfiles");

            migrationBuilder.DropForeignKey(
                name: "FK_TutorSubjects_TutorProfiles_TutorId",
                table: "TutorSubjects");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TutorProfiles",
                table: "TutorProfiles");

            migrationBuilder.DropPrimaryKey(
                name: "PK_StudentProfiles",
                table: "StudentProfiles");

            migrationBuilder.RenameTable(
                name: "TutorProfiles",
                newName: "Tutors");

            migrationBuilder.RenameTable(
                name: "StudentProfiles",
                newName: "Students");

            migrationBuilder.RenameIndex(
                name: "IX_TutorProfiles_UserId",
                table: "Tutors",
                newName: "IX_Tutors_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_TutorProfiles_CvFileId",
                table: "Tutors",
                newName: "IX_Tutors_CvFileId");

            migrationBuilder.RenameIndex(
                name: "IX_TutorProfiles_Code",
                table: "Tutors",
                newName: "IX_Tutors_Code");

            migrationBuilder.RenameIndex(
                name: "IX_TutorProfiles_AddressId",
                table: "Tutors",
                newName: "IX_Tutors_AddressId");

            migrationBuilder.RenameIndex(
                name: "IX_StudentProfiles_UserId",
                table: "Students",
                newName: "IX_Students_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_StudentProfiles_Code",
                table: "Students",
                newName: "IX_Students_Code");

            migrationBuilder.RenameIndex(
                name: "IX_StudentProfiles_AddressId",
                table: "Students",
                newName: "IX_Students_AddressId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Tutors",
                table: "Tutors",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Students",
                table: "Students",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Applications_Tutors_TutorId",
                table: "Applications",
                column: "TutorId",
                principalTable: "Tutors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Classes_Tutors_TutorId",
                table: "Classes",
                column: "TutorId",
                principalTable: "Tutors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Tutors_TutorId",
                table: "Payments",
                column: "TutorId",
                principalTable: "Tutors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Tutors_TutorId",
                table: "Reviews",
                column: "TutorId",
                principalTable: "Tutors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Students_Addresses_AddressId",
                table: "Students",
                column: "AddressId",
                principalTable: "Addresses",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Students_Users_UserId",
                table: "Students",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Tutors_Addresses_AddressId",
                table: "Tutors",
                column: "AddressId",
                principalTable: "Addresses",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Tutors_Files_CvFileId",
                table: "Tutors",
                column: "CvFileId",
                principalTable: "Files",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Tutors_Users_UserId",
                table: "Tutors",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TutorSubjects_Tutors_TutorId",
                table: "TutorSubjects",
                column: "TutorId",
                principalTable: "Tutors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Applications_Tutors_TutorId",
                table: "Applications");

            migrationBuilder.DropForeignKey(
                name: "FK_Classes_Tutors_TutorId",
                table: "Classes");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Tutors_TutorId",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Tutors_TutorId",
                table: "Reviews");

            migrationBuilder.DropForeignKey(
                name: "FK_Students_Addresses_AddressId",
                table: "Students");

            migrationBuilder.DropForeignKey(
                name: "FK_Students_Users_UserId",
                table: "Students");

            migrationBuilder.DropForeignKey(
                name: "FK_Tutors_Addresses_AddressId",
                table: "Tutors");

            migrationBuilder.DropForeignKey(
                name: "FK_Tutors_Files_CvFileId",
                table: "Tutors");

            migrationBuilder.DropForeignKey(
                name: "FK_Tutors_Users_UserId",
                table: "Tutors");

            migrationBuilder.DropForeignKey(
                name: "FK_TutorSubjects_Tutors_TutorId",
                table: "TutorSubjects");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Tutors",
                table: "Tutors");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Students",
                table: "Students");

            migrationBuilder.RenameTable(
                name: "Tutors",
                newName: "TutorProfiles");

            migrationBuilder.RenameTable(
                name: "Students",
                newName: "StudentProfiles");

            migrationBuilder.RenameIndex(
                name: "IX_Tutors_UserId",
                table: "TutorProfiles",
                newName: "IX_TutorProfiles_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_Tutors_CvFileId",
                table: "TutorProfiles",
                newName: "IX_TutorProfiles_CvFileId");

            migrationBuilder.RenameIndex(
                name: "IX_Tutors_Code",
                table: "TutorProfiles",
                newName: "IX_TutorProfiles_Code");

            migrationBuilder.RenameIndex(
                name: "IX_Tutors_AddressId",
                table: "TutorProfiles",
                newName: "IX_TutorProfiles_AddressId");

            migrationBuilder.RenameIndex(
                name: "IX_Students_UserId",
                table: "StudentProfiles",
                newName: "IX_StudentProfiles_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_Students_Code",
                table: "StudentProfiles",
                newName: "IX_StudentProfiles_Code");

            migrationBuilder.RenameIndex(
                name: "IX_Students_AddressId",
                table: "StudentProfiles",
                newName: "IX_StudentProfiles_AddressId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_TutorProfiles",
                table: "TutorProfiles",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_StudentProfiles",
                table: "StudentProfiles",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Applications_TutorProfiles_TutorId",
                table: "Applications",
                column: "TutorId",
                principalTable: "TutorProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Classes_TutorProfiles_TutorId",
                table: "Classes",
                column: "TutorId",
                principalTable: "TutorProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_TutorProfiles_TutorId",
                table: "Payments",
                column: "TutorId",
                principalTable: "TutorProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_TutorProfiles_TutorId",
                table: "Reviews",
                column: "TutorId",
                principalTable: "TutorProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_StudentProfiles_Addresses_AddressId",
                table: "StudentProfiles",
                column: "AddressId",
                principalTable: "Addresses",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_StudentProfiles_Users_UserId",
                table: "StudentProfiles",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TutorProfiles_Addresses_AddressId",
                table: "TutorProfiles",
                column: "AddressId",
                principalTable: "Addresses",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TutorProfiles_Files_CvFileId",
                table: "TutorProfiles",
                column: "CvFileId",
                principalTable: "Files",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TutorProfiles_Users_UserId",
                table: "TutorProfiles",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TutorSubjects_TutorProfiles_TutorId",
                table: "TutorSubjects",
                column: "TutorId",
                principalTable: "TutorProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
