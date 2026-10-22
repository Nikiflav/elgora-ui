export default {
  "name": "DataGridColumn",
  "kind": "interface",
  "type": "DataGridColumn<TRow>",
  "description": "Presentation and interaction of a field as a column in DataGrid.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/DataGridColumn",
  "source": "src/components/datagrid/DataGridColumn.ts",
  "members": [
    {
      "name": "editorButtonVisibility",
      "type": "\"hover\" | \"always\" | \"never\" | undefined",
      "description": "Cell picker trigger visibility outside editing. Defaults to hover; always also supports touch.\nnever hides only the cell trigger, not the editor's own button or keyboard access.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataGridColumn.ts",
      "kind": "property"
    },
    {
      "name": "width",
      "type": "number | undefined",
      "description": "Column width in pixels. Omit for content measurement with an 80px minimum.\nAutomatic measurement includes loaded body text and visible totals; later totals can grow it.\nExplicit widths and manual resizing are not constrained by the auto-width minimum.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataGridColumn.ts",
      "kind": "property"
    },
    {
      "name": "textAlign",
      "type": "\"start\" | \"center\" | \"end\" | undefined",
      "description": "Alignment of the grid cell content.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataGridColumn.ts",
      "kind": "property"
    },
    {
      "name": "resizable",
      "type": "boolean | undefined",
      "description": "Whether the user can resize this column.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataGridColumn.ts",
      "kind": "property"
    },
    {
      "name": "reorderable",
      "type": "boolean | undefined",
      "description": "Whether the user can reorder this column.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataGridColumn.ts",
      "kind": "property"
    },
    {
      "name": "logicalOrder",
      "type": "number | undefined",
      "description": "Relative ordering hint among grid columns.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataGridColumn.ts",
      "kind": "property"
    },
    {
      "name": "contextMenuItems",
      "type": "GridContextMenuItems<TRow> | undefined",
      "description": "Context-menu items for cells in this column.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataGridColumn.ts",
      "kind": "property"
    },
    {
      "name": "headerContextMenuItems",
      "type": "GridContextMenuItems<TRow> | undefined",
      "description": "Context-menu items for this column's header.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataGridColumn.ts",
      "kind": "property"
    },
    {
      "name": "customCellStyle",
      "type": "((cell: GridCell<TRow>) => DataCellStyle | undefined | null) | undefined",
      "description": "Provides custom style for the outer grid cell.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataGridColumn.ts",
      "parameters": [
        {
          "name": "cell",
          "type": "GridCell<TRow>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "DataCellStyle | undefined | null",
        "description": ""
      },
      "kind": "method",
      "signature": "((cell: GridCell<TRow>) => DataCellStyle | undefined | null) | undefined"
    },
    {
      "name": "renderCell",
      "type": "((cell: GridCell<TRow>) => VNode<any>) | undefined",
      "description": "Returns a VNode that replaces the default value/text display inside the grid cell wrapper.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataGridColumn.ts",
      "parameters": [
        {
          "name": "cell",
          "type": "GridCell<TRow>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "VNode<any>",
        "description": ""
      },
      "kind": "method",
      "signature": "((cell: GridCell<TRow>) => VNode<any>) | undefined"
    }
  ]
};
