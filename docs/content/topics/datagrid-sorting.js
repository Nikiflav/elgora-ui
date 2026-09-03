export default {
  "id": "datagrid-sorting",
  "title": "Sorting",
  "path": "/components/datagrid/sorting",
  "group": "components",
  "parent": "datagrid",
  "order": 53,
  "description": "Sort one or more DataGrid columns and control sort state programmatically.",
  "toc": true,
  "api": [
    "DataGrid",
    "DataGridOptions",
    "OrderByToken"
  ],
  "keywords": [
    "sorting",
    "order by",
    "multi-column sort"
  ],
  "html": "<h1>Sorting</h1>\n<p>Sorting can be changed from the column context menu or configured with\n<code>orderBy</code>. Use a string for ascending order or a tuple for an explicit\ndirection.</p>\n<div data-live-demo=\"datagrid-sorting\"></div>The header shows the current direction. The example starts with a two-column\nsort and allows the normal column menu to replace or clear it.\n<pre><code class=\"language-js\">grid.setOptions({ orderBy: [[&quot;region&quot;, &quot;asc&quot;], [&quot;total&quot;, &quot;desc&quot;]] });\n</code></pre>\n<h2>API reference</h2>\n<p>See <a href=\"?!=/api-reference/DataGridOptions\"><code>DataGridOptions</code></a> and\n<a href=\"?!=/api-reference/DataGrid\"><code>DataGrid</code></a>.</p>\n",
  "demos": [
    {
      "id": "datagrid-sorting",
      "source": "const rows = [\n    { region: \"West\", product: \"Keyboard\", total: 356 },\n    { region: \"East\", product: \"Monitor\", total: 498 },\n    { region: \"West\", product: \"Webcam\", total: 483 },\n    { region: \"East\", product: \"Dock\", total: 537 },\n    { region: \"North\", product: \"Mouse\", total: 118 }\n];\nconst grid = new DataGrid({\n    data: new ArrayDataSource(rows),\n    columns: [\n        { name: \"region\", caption: \"Region\", width: 130 },\n        { name: \"product\", caption: \"Product\", width: 220 },\n        { name: \"total\", caption: \"Total\", width: 120, textAlign: \"end\" }\n    ],\n    orderBy: [[\"region\", \"asc\"], [\"total\", \"desc\"]]\n});\ngrid.dom.style.height = \"360px\";\ngrid.refresh();\ngrid.mount(document.body);",
      "code": "with (Elgora) {\nfunction createDemo() {\n    const rows = [\n        { region: \"West\", product: \"Keyboard\", total: 356 },\n        { region: \"East\", product: \"Monitor\", total: 498 },\n        { region: \"West\", product: \"Webcam\", total: 483 },\n        { region: \"East\", product: \"Dock\", total: 537 },\n        { region: \"North\", product: \"Mouse\", total: 118 }\n    ];\n    const grid = new DataGrid({\n        data: new ArrayDataSource(rows),\n        columns: [\n            { name: \"region\", caption: \"Region\", width: 130 },\n            { name: \"product\", caption: \"Product\", width: 220 },\n            { name: \"total\", caption: \"Total\", width: 120, textAlign: \"end\" }\n        ],\n        orderBy: [[\"region\", \"asc\"], [\"total\", \"desc\"]]\n    });\n    grid.dom.style.height = \"360px\";\n    grid.refresh();\n    grid.mount(document.body);\n}\ncreateDemo();\n}",
      "height": "360px"
    }
  ]
};
