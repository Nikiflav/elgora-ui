export default {
  "id": "datagrid-filtering",
  "title": "Filtering",
  "path": "/components/datagrid/filtering",
  "group": "components",
  "parent": "datagrid",
  "order": 54,
  "description": "Filter local or remote DataGrid data with structured filter expressions.",
  "toc": true,
  "api": [
    "DataGrid",
    "DataFilter",
    "FilterFunctionRegistry"
  ],
  "keywords": [
    "filtering",
    "filter row",
    "data filter"
  ],
  "html": "<h1>Filtering</h1>\n<p>The <code>filter</code> option uses a serializable expression that can be evaluated by a\nlocal data source or forwarded to a server. Enable <code>showFilterRow</code> when the\ngrid should expose a filtering surface.</p>\n<div data-live-demo=\"datagrid-filtering\"></div>The example starts with an explicit `contains` filter. Application code can\nchange it at any time:\n<pre><code class=\"language-js\">grid.setOptions({ filter: [&quot;product&quot;, &quot;contains&quot;, &quot;monitor&quot;] });\ngrid.setOptions({ filter: [&quot;and&quot;, [&quot;region&quot;, &quot;=&quot;, &quot;East&quot;], [&quot;total&quot;, &quot;&gt;&quot;, 400]] });\n</code></pre>\n<h2>API reference</h2>\n<p>See <a href=\"?!=/api-reference/DataFilter\"><code>DataFilter</code></a>,\n<a href=\"?!=/api-reference/DataGridOptions\"><code>DataGridOptions</code></a>, and\n<a href=\"?!=/api-reference/FilterFunctionRegistry\"><code>FilterFunctionRegistry</code></a>.</p>\n",
  "demos": [
    {
      "id": "datagrid-filtering",
      "module": "./content/components/datagrid/filtering.md.ts",
      "source": "const rows = [\n    { region: \"West\", product: \"Keyboard\", total: 356 },\n    { region: \"East\", product: \"Monitor\", total: 498 },\n    { region: \"West\", product: \"Webcam\", total: 483 },\n    { region: \"East\", product: \"Dock\", total: 537 },\n    { region: \"North\", product: \"Mouse\", total: 118 }\n];\nconst grid = new DataGrid({\n    data: rows,\n    columns: [\n        { name: \"region\", caption: \"Region\", width: 130 },\n        { name: \"product\", caption: \"Product\", width: 220 },\n        { name: \"total\", caption: \"Total\", width: 120, textAlign: \"end\" }\n    ],\n    filter: [\"product\", \"contains\", \"o\"]\n});\ngrid.dom.style.height = \"360px\";\ngrid.refresh();\ngrid.mount(document.body);",
      "code": "const rows = [\n    { region: \"West\", product: \"Keyboard\", total: 356 },\n    { region: \"East\", product: \"Monitor\", total: 498 },\n    { region: \"West\", product: \"Webcam\", total: 483 },\n    { region: \"East\", product: \"Dock\", total: 537 },\n    { region: \"North\", product: \"Mouse\", total: 118 }\n];\nconst grid = new DataGrid({\n    data: rows,\n    columns: [\n        { name: \"region\", caption: \"Region\", width: 130 },\n        { name: \"product\", caption: \"Product\", width: 220 },\n        { name: \"total\", caption: \"Total\", width: 120, textAlign: \"end\" }\n    ],\n    filter: [\"product\", \"contains\", \"o\"]\n});\ngrid.dom.style.height = \"360px\";\ngrid.refresh();\ngrid.mount(document.body);",
      "height": "360px"
    }
  ]
};
