using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InventoryApi.Migrations
{
    /// <inheritdoc />
    public partial class Phase4ItemsAndFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Items_InventoryId",
                table: "Items");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Items",
                newName: "CustomId");

            migrationBuilder.CreateTable(
                name: "InventoryFields",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    ShowInTable = table.Column<bool>(type: "boolean", nullable: false),
                    InventoryId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryFields", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InventoryFields_Inventories_InventoryId",
                        column: x => x.InventoryId,
                        principalTable: "Inventories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ItemFieldValues",
                columns: table => new
                {
                    ItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    FieldId = table.Column<Guid>(type: "uuid", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItemFieldValues", x => new { x.ItemId, x.FieldId });
                    table.ForeignKey(
                        name: "FK_ItemFieldValues_InventoryFields_FieldId",
                        column: x => x.FieldId,
                        principalTable: "InventoryFields",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ItemFieldValues_Items_ItemId",
                        column: x => x.ItemId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Items_InventoryId_CustomId",
                table: "Items",
                columns: new[] { "InventoryId", "CustomId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InventoryFields_InventoryId",
                table: "InventoryFields",
                column: "InventoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemFieldValues_FieldId",
                table: "ItemFieldValues",
                column: "FieldId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ItemFieldValues");

            migrationBuilder.DropTable(
                name: "InventoryFields");

            migrationBuilder.DropIndex(
                name: "IX_Items_InventoryId_CustomId",
                table: "Items");

            migrationBuilder.RenameColumn(
                name: "CustomId",
                table: "Items",
                newName: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Items_InventoryId",
                table: "Items",
                column: "InventoryId");
        }
    }
}
