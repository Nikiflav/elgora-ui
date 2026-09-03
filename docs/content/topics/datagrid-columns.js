export default {
  "id": "datagrid-columns",
  "title": "Columns and layout",
  "path": "/components/datagrid/columns",
  "group": "components",
  "parent": "datagrid",
  "order": 52,
  "description": "Configure column captions, widths, alignment, visibility, and layout behavior.",
  "toc": true,
  "api": [
    "DataGrid",
    "DataGridOptions",
    "DataColumn"
  ],
  "keywords": [
    "columns",
    "resize",
    "reorder",
    "pinning",
    "layout"
  ],
  "html": "<h1>Columns and layout</h1>\n<p>Columns define how a DataGrid reads, displays, and lays out each field. Use\ncaptions for user-facing labels and keep field names focused on the data model.</p>\n<div data-live-demo=\"datagrid-columns\"></div>The demo combines captions, fixed widths, alignment, hidden columns, and fixed\ncolumns. Column headers can also be resized and reordered directly.\n<pre><code class=\"language-js\">const grid = new DataGrid({\n  data: rows,\n  columns: [\n    { name: &quot;product&quot;, caption: &quot;Product&quot;, width: 220 },\n    { name: &quot;quantity&quot;, caption: &quot;Qty&quot;, width: 80, textAlign: &quot;end&quot; },\n    { name: &quot;total&quot;, caption: &quot;Total&quot;, width: 110, textAlign: &quot;end&quot; }\n  ],\n  fixedLeftColumns: 1\n});\n</code></pre>\n<p>Use <code>setColumnOptions()</code> for a single column and <code>setOptions()</code> for layout-wide\nchanges such as <code>visibleColumns</code>, <code>fixedLeftColumns</code>, and <code>fixedRightColumns</code>.</p>\n<h2>API reference</h2>\n<p>See <a href=\"?!=/api-reference/DataColumn\"><code>DataColumn</code></a> and\n<a href=\"?!=/api-reference/DataGridOptions\"><code>DataGridOptions</code></a>.</p>\n",
  "demos": [
    {
      "id": "datagrid-columns",
      "source": "const rows = [\n    { id: 1, product: \"Keyboard\", quantity: 4, total: 356 },\n    { id: 2, product: \"Monitor\", quantity: 2, total: 498 },\n    { id: 3, product: \"Webcam\", quantity: 7, total: 483 },\n    { id: 4, product: \"Dock\", quantity: 3, total: 537 }\n];\nconst grid = new DataGrid({\n    data: rows,\n    columns: [\n        { name: \"id\", caption: \"ID\", width: 60, textAlign: \"end\" },\n        { name: \"product\", caption: \"Product\", width: 220 },\n        { name: \"quantity\", caption: \"Qty\", width: 80, textAlign: \"end\" },\n        { name: \"total\", caption: \"Total\", width: 110, textAlign: \"end\" }\n    ],\n    fixedLeftColumns: 1,\n    fixedRightColumns: 1\n});\ngrid.dom.style.height = \"360px\";\ngrid.refresh();\ngrid.mount(document.body);",
      "code": "with (Elgora) {\nfunction createDemo() {\n    const rows = [\n        { id: 1, product: \"Keyboard\", quantity: 4, total: 356 },\n        { id: 2, product: \"Monitor\", quantity: 2, total: 498 },\n        { id: 3, product: \"Webcam\", quantity: 7, total: 483 },\n        { id: 4, product: \"Dock\", quantity: 3, total: 537 }\n    ];\n    const grid = new DataGrid({\n        data: rows,\n        columns: [\n            { name: \"id\", caption: \"ID\", width: 60, textAlign: \"end\" },\n            { name: \"product\", caption: \"Product\", width: 220 },\n            { name: \"quantity\", caption: \"Qty\", width: 80, textAlign: \"end\" },\n            { name: \"total\", caption: \"Total\", width: 110, textAlign: \"end\" }\n        ],\n        fixedLeftColumns: 1,\n        fixedRightColumns: 1\n    });\n    grid.dom.style.height = \"360px\";\n    grid.refresh();\n    grid.mount(document.body);\n}\ncreateDemo();\n}",
      "height": "360px"
    }
  ]
};
