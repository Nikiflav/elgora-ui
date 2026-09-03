export default {
  "id": "datagrid-custom-cell-rendering",
  "title": "Custom cell rendering",
  "path": "/components/datagrid/custom-cell-rendering",
  "group": "components",
  "parent": "datagrid",
  "order": 70,
  "description": "Customize DataGrid cell content and appearance while keeping grid states theme-aware.",
  "toc": true,
  "api": [
    "DataGrid",
    "DataColumn",
    "DataCell",
    "DataCellStyle"
  ],
  "keywords": [
    "data grid",
    "custom cell",
    "renderer",
    "cell style",
    "selection"
  ],
  "html": "<h1>Custom cell rendering</h1>\n<p>Use <code>renderCell</code> when the default text representation is not enough. The\nrenderer returns the content for the cell, while DataGrid continues to own\nselection, hover, dragging, and other cell states.</p>\n<h2>Custom content and state-aware styling</h2>\n<p>Use <code>customCellStyle</code> to style the outer grid cell. In particular,\n<code>--elg-grid-cell-bg</code> is the base background used by DataGrid when it mixes a\ncell state such as selection with the custom color.</p>\n<p>The renderer below returns a native element for the status text. <code>Ready</code> cells\nuse a soft green base color, while <code>Delayed</code> cells use a muted red one. The\nstatus text is also rendered in uppercase. Select one or more cells to see the\nselection border and background tint applied without changing the renderer’s\ntext.</p>\n<div data-live-demo=\"datagrid-custom-cell-rendering\"></div>\n<p><code>renderCell</code> receives a <code>DataCell</code> with the column, original row, raw value,\nand display text. It may return an <code>HTMLElement</code>, a Component, a virtual node,\nor a string. Returning <code>undefined</code> uses the default renderer.</p>\n<p><code>customCellStyle</code> affects the outer <code>.elg-gridcell</code>, not only the returned\ncontent. This is important because the grid can then apply state styling to a\ncustom green or red background. The renderer does not need to know how\nselection or hover colors are implemented.</p>\n<h2>API reference</h2>\n<p>See <a href=\"?!=/api-reference/DataColumn\"><code>DataColumn</code></a>, <a href=\"?!=/api-reference/DataCell\"><code>DataCell</code></a>,\nand <a href=\"?!=/api-reference/DataCellStyle\"><code>DataCellStyle</code></a> for the complete\nrenderer and style contracts.</p>\n",
  "demos": [
    {
      "id": "datagrid-custom-cell-rendering",
      "source": "const rows = [\n    { id: 1, product: \"Keyboard\", status: \"Ready\", amount: 89 },\n    { id: 2, product: \"Monitor\", status: \"Delayed\", amount: 249 },\n    { id: 3, product: \"Webcam\", status: \"Ready\", amount: 69 },\n    { id: 4, product: \"Desk lamp\", status: \"Delayed\", amount: 42 },\n    { id: 5, product: \"Headphones\", status: \"Ready\", amount: 129 },\n    { id: 6, product: \"Mouse\", status: \"Ready\", amount: 59 },\n    { id: 7, product: \"Docking station\", status: \"Delayed\", amount: 179 },\n    { id: 8, product: \"Microphone\", status: \"Ready\", amount: 149 }\n];\nconst grid = new DataGrid({\n    data: rows,\n    columns: [\n        { name: \"id\", caption: \"ID\", editorType: \"number\", width: 60 },\n        { name: \"product\", caption: \"Product\", editorType: \"text\", width: 220 },\n        {\n            name: \"status\",\n            caption: \"Status\",\n            editorType: \"text\",\n            customCellStyle: cell => ({\n                className: \"elg-text-uppercase\",\n                style: {\n                    \"--elg-grid-cell-bg\": cell.value === \"Ready\" ? \"#d9f2e3\" : \"#f7dfdf\"\n                }\n            }),\n            renderCell: cell => e(\"strong\", { ui: [\"fw-600\"] }, cell.text)\n        },\n        {\n            name: \"amount\",\n            caption: \"Amount\",\n            editorType: \"number\",\n            textAlign: \"end\",\n            renderCell: cell => e(\"span\", { ui: [\"fw-600\"] }, `$${cell.value}`)\n        }\n    ]\n});\ngrid.dom.style.height = \"360px\";\ngrid.refresh();\ngrid.mount(document.body);",
      "code": "with (Elgora) {\nfunction createDemo() {\n    const rows = [\n        { id: 1, product: \"Keyboard\", status: \"Ready\", amount: 89 },\n        { id: 2, product: \"Monitor\", status: \"Delayed\", amount: 249 },\n        { id: 3, product: \"Webcam\", status: \"Ready\", amount: 69 },\n        { id: 4, product: \"Desk lamp\", status: \"Delayed\", amount: 42 },\n        { id: 5, product: \"Headphones\", status: \"Ready\", amount: 129 },\n        { id: 6, product: \"Mouse\", status: \"Ready\", amount: 59 },\n        { id: 7, product: \"Docking station\", status: \"Delayed\", amount: 179 },\n        { id: 8, product: \"Microphone\", status: \"Ready\", amount: 149 }\n    ];\n    const grid = new DataGrid({\n        data: rows,\n        columns: [\n            { name: \"id\", caption: \"ID\", editorType: \"number\", width: 60 },\n            { name: \"product\", caption: \"Product\", editorType: \"text\", width: 220 },\n            {\n                name: \"status\",\n                caption: \"Status\",\n                editorType: \"text\",\n                customCellStyle: cell => ({\n                    className: \"elg-text-uppercase\",\n                    style: {\n                        \"--elg-grid-cell-bg\": cell.value === \"Ready\" ? \"#d9f2e3\" : \"#f7dfdf\"\n                    }\n                }),\n                renderCell: cell => e(\"strong\", { ui: [\"fw-600\"] }, cell.text)\n            },\n            {\n                name: \"amount\",\n                caption: \"Amount\",\n                editorType: \"number\",\n                textAlign: \"end\",\n                renderCell: cell => e(\"span\", { ui: [\"fw-600\"] }, `$${cell.value}`)\n            }\n        ]\n    });\n    grid.dom.style.height = \"360px\";\n    grid.refresh();\n    grid.mount(document.body);\n}\ncreateDemo();\n}",
      "height": "360px"
    }
  ]
};
