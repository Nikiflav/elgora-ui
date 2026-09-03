export default {
  "id": "datagrid-context-menus",
  "title": "Context menus",
  "path": "/components/datagrid/context-menus",
  "group": "components",
  "parent": "datagrid",
  "order": 61,
  "description": "Configure column, row, row-header, and cell context-menu actions.",
  "toc": true,
  "api": [
    "DataGrid",
    "DataGridContextMenuContext",
    "GridContextMenuItems",
    "GridStandardContextMenuItem"
  ],
  "keywords": [
    "context menu",
    "row actions",
    "column actions",
    "custom actions"
  ],
  "html": "<h1>Context menus</h1>\n<p>DataGrid exposes separate customization points for cells, rows, row headers,\nand column headers. Keep standard actions and add application-specific actions\nwhere they are relevant.</p>\n<div data-live-demo=\"datagrid-context-menus\"></div>The demo adds a custom row action while retaining the built-in column menu.\nContext callbacks receive the row, column, selected ranges, and originating\nmouse event.\n<h2>API reference</h2>\n<p>See <a href=\"?!=/api-reference/DataGridContextMenuContext\"><code>DataGridContextMenuContext</code></a>,\n<a href=\"?!=/api-reference/GridContextMenuItems\"><code>GridContextMenuItems</code></a>, and\n<a href=\"?!=/api-reference/GridStandardContextMenuItem\"><code>GridStandardContextMenuItem</code></a>.</p>\n",
  "demos": [
    {
      "id": "datagrid-context-menus",
      "module": "./content/components/datagrid/context-menus.md.ts",
      "source": "const rows = [\n    { id: 1, customer: \"Acme Corp\", total: 356 },\n    { id: 2, customer: \"Northwind\", total: 498 },\n    { id: 3, customer: \"Contoso\", total: 483 },\n    { id: 4, customer: \"Adventure Works\", total: 537 }\n];\nconst grid = new DataGrid({\n    data: rows,\n    columns: [\n        { name: \"id\", caption: \"ID\", width: 60 },\n        { name: \"customer\", caption: \"Customer\", width: 240 },\n        { name: \"total\", caption: \"Total\", width: 120, textAlign: \"end\" }\n    ],\n    rowContextMenuItems: context => [\n        { text: `Inspect ${context.rowData?.customer ?? \"row\"}`, action: () => console.log(context.rowData) }\n    ]\n});\ngrid.dom.style.height = \"360px\";\ngrid.refresh();\ngrid.mount(document.body);",
      "code": "const rows = [\n    { id: 1, customer: \"Acme Corp\", total: 356 },\n    { id: 2, customer: \"Northwind\", total: 498 },\n    { id: 3, customer: \"Contoso\", total: 483 },\n    { id: 4, customer: \"Adventure Works\", total: 537 }\n];\nconst grid = new DataGrid({\n    data: rows,\n    columns: [\n        { name: \"id\", caption: \"ID\", width: 60 },\n        { name: \"customer\", caption: \"Customer\", width: 240 },\n        { name: \"total\", caption: \"Total\", width: 120, textAlign: \"end\" }\n    ],\n    rowContextMenuItems: context => [\n        { text: `Inspect ${context.rowData?.customer ?? \"row\"}`, action: () => console.log(context.rowData) }\n    ]\n});\ngrid.dom.style.height = \"360px\";\ngrid.refresh();\ngrid.mount(document.body);",
      "height": "360px"
    }
  ]
};
