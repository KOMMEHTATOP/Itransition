{
    "name": "Inventory Importer",
    "version": "1.0",
    "summary": "Import aggregated inventory data from the course project via an API token",
    "description": """
Read-only Odoo viewer for aggregated inventory data coming from the course project.

- Stores imported inventories (title, fields, aggregated results).
- Provides an "Import" action that pulls data by an API token from the course project's
  external API (GET /api/external/inventory?token=...).
- View the list of imported inventories and detailed info for each of them.
""",
    "category": "Tools",
    "license": "LGPL-3",
    "author": "Itransition Course Project",
    "depends": ["base"],
    "data": [
        "security/ir.model.access.csv",
        "views/inventory_views.xml",
        "views/import_wizard_views.xml",
    ],
    "application": True,
    "installable": True,
}
