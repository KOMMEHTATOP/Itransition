from odoo import models, fields


class ImportedInventory(models.Model):
    _name = "inventory.imported"
    _description = "Imported Inventory"
    _order = "imported_at desc"

    name = fields.Char(string="Title", required=True)
    api_token = fields.Char(string="API Token")
    item_count = fields.Integer(string="Item Count")
    imported_at = fields.Datetime(string="Imported At")
    field_ids = fields.One2many(
        "inventory.imported.field", "inventory_id", string="Fields"
    )


class ImportedField(models.Model):
    _name = "inventory.imported.field"
    _description = "Imported Inventory Field"
    _order = "id"

    inventory_id = fields.Many2one(
        "inventory.imported",
        string="Inventory",
        ondelete="cascade",
        required=True,
    )
    name = fields.Char(string="Field", required=True)
    field_type = fields.Char(string="Type")
    aggregate = fields.Char(string="Aggregated Result")
