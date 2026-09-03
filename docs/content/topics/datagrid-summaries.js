export default {
  "id": "datagrid-summaries",
  "title": "Summaries",
  "path": "/components/datagrid/summaries",
  "group": "components",
  "parent": "datagrid",
  "order": 56,
  "description": "Display numeric and custom aggregate values for grouped DataGrid rows.",
  "toc": true,
  "api": [
    "DataGrid",
    "SummaryType",
    "SummaryDefinition",
    "SummaryContext"
  ],
  "keywords": [
    "summaries",
    "aggregates",
    "sum",
    "count"
  ],
  "html": "<h1>Summaries</h1>\n<p>Summaries add useful totals to grouped data. Built-in types include <code>count</code>,\n<code>sum</code>, <code>min</code>, <code>max</code>, and <code>distinct</code>. Custom summaries can maintain their own\naccumulator state.</p>\n<div data-live-demo=\"datagrid-summaries\"></div>\n<h2>API reference</h2>\n<p>See <a href=\"?!=/api-reference/SummaryDefinition\"><code>SummaryDefinition</code></a>,\n<a href=\"?!=/api-reference/SummaryContext\"><code>SummaryContext</code></a>, and\n<a href=\"?!=/api-reference/SummaryType\"><code>SummaryType</code></a>.</p>\n",
  "demos": [
    {
      "id": "datagrid-summaries",
      "module": "./content/components/datagrid/summaries.md.ts",
      "source": "const rows = [\n    { region: \"West\", product: \"Keyboard\", total: 356 },\n    { region: \"East\", product: \"Monitor\", total: 498 },\n    { region: \"West\", product: \"Webcam\", total: 483 },\n    { region: \"East\", product: \"Dock\", total: 537 },\n    { region: \"North\", product: \"Mouse\", total: 118 },\n    { region: \"North\", product: \"Keyboard\", total: 267 }\n];\nconst grid = new DataGrid({\n    data: rows,\n    columns: [\n        { name: \"region\", caption: \"Region\", width: 140 },\n        { name: \"product\", caption: \"Product\", width: 220 },\n        { name: \"total\", caption: \"Total\", width: 120, textAlign: \"end\" }\n    ],\n    groupColumns: [\"region\"],\n    groupSummary: [{ field: \"total\", summaryType: \"sum\" }]\n});\ngrid.dom.style.height = \"360px\";\ngrid.refresh();\ngrid.mount(document.body);",
      "code": "const rows = [\n    { region: \"West\", product: \"Keyboard\", total: 356 },\n    { region: \"East\", product: \"Monitor\", total: 498 },\n    { region: \"West\", product: \"Webcam\", total: 483 },\n    { region: \"East\", product: \"Dock\", total: 537 },\n    { region: \"North\", product: \"Mouse\", total: 118 },\n    { region: \"North\", product: \"Keyboard\", total: 267 }\n];\nconst grid = new DataGrid({\n    data: rows,\n    columns: [\n        { name: \"region\", caption: \"Region\", width: 140 },\n        { name: \"product\", caption: \"Product\", width: 220 },\n        { name: \"total\", caption: \"Total\", width: 120, textAlign: \"end\" }\n    ],\n    groupColumns: [\"region\"],\n    groupSummary: [{ field: \"total\", summaryType: \"sum\" }]\n});\ngrid.dom.style.height = \"360px\";\ngrid.refresh();\ngrid.mount(document.body);",
      "height": "360px"
    }
  ]
};
