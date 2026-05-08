using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduMatch.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeUserAvatarToFileRelation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "AvatarFileId",
                table: "Users",
                type: "bigint",
                nullable: true);

            migrationBuilder.Sql("""
                INSERT INTO "Files" ("FileName", "FileSize", "ContentType", "FileType", "FilePath", "CreatedAt", "UpdatedAt", "IsDeleted")
                SELECT
                    CONCAT('legacy-avatar-', u."Id"),
                    0,
                    'image/jpeg',
                    'avatar',
                    u."AvatarUrl",
                    u."CreatedAt",
                    NULL,
                    FALSE
                FROM "Users" u
                WHERE u."AvatarUrl" IS NOT NULL
                  AND BTRIM(u."AvatarUrl") <> '';
                """);

            migrationBuilder.Sql("""
                UPDATE "Users" u
                SET "AvatarFileId" = f."Id"
                FROM "Files" f
                WHERE u."AvatarUrl" IS NOT NULL
                  AND BTRIM(u."AvatarUrl") <> ''
                  AND f."FileType" = 'avatar'
                  AND f."FileName" = CONCAT('legacy-avatar-', u."Id")
                  AND f."FilePath" = u."AvatarUrl";
                """);

            migrationBuilder.DropColumn(
                name: "AvatarUrl",
                table: "Users");

            migrationBuilder.CreateIndex(
                name: "IX_Users_AvatarFileId",
                table: "Users",
                column: "AvatarFileId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Files_AvatarFileId",
                table: "Users",
                column: "AvatarFileId",
                principalTable: "Files",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Files_AvatarFileId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_AvatarFileId",
                table: "Users");

            migrationBuilder.AddColumn<string>(
                name: "AvatarUrl",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "Users" u
                SET "AvatarUrl" = f."FilePath"
                FROM "Files" f
                WHERE u."AvatarFileId" = f."Id";
                """);

            migrationBuilder.DropColumn(
                name: "AvatarFileId",
                table: "Users");
        }
    }
}
