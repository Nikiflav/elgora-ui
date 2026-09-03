export default {
  "id": "datagrid-grouping",
  "title": "Grouping",
  "path": "/components/datagrid/grouping",
  "group": "components",
  "parent": "datagrid",
  "order": 55,
  "description": "Group rows by one or more columns, intervals, and interactive group chips.",
  "toc": true,
  "api": [
    "DataGrid",
    "GroupInterval",
    "GroupIntervalDefinition"
  ],
  "keywords": [
    "grouping",
    "group rows",
    "intervals",
    "group panel"
  ],
  "html": "<h1>Grouping</h1>\n<p>Grouping turns a flat result into an expandable hierarchy. Configure\n<code>groupColumns</code> for the initial state, then let users add, remove, and reorder\ngroups from the group panel or column context menu.</p>\n<div data-live-demo=\"datagrid-grouping\"></div>Dates and numbers can use built-in intervals. Application-specific buckets can\nbe registered with `groupIntervals` and resolved by `getGroupValue`.\n<pre><code class=\"language-js\">grid.setOptions({ groupColumns: [&quot;region&quot;, &quot;product&quot;] });\n</code></pre>\n<h2>API reference</h2>\n<p>See <a href=\"?!=/api-reference/DataGrid\"><code>DataGrid</code></a>,\n<a href=\"?!=/api-reference/GroupInterval\"><code>GroupInterval</code></a>, and\n<a href=\"?!=/api-reference/GroupIntervalDefinition\"><code>GroupIntervalDefinition</code></a>.</p>\n",
  "demos": [
    {
      "id": "datagrid-grouping",
      "source": "const rows = [\n    { region: \"West\", product: \"Keyboard\", total: 356 },\n    { region: \"East\", product: \"Monitor\", total: 498 },\n    { region: \"West\", product: \"Webcam\", total: 483 },\n    { region: \"East\", product: \"Dock\", total: 537 },\n    { region: \"North\", product: \"Mouse\", total: 118 },\n    { region: \"North\", product: \"Keyboard\", total: 267 }\n];\nconst grid = new DataGrid({\n    data: rows,\n    columns: [\n        { name: \"region\", caption: \"Region\", width: 140, groupInterval: \"firstChar\" },\n        { name: \"product\", caption: \"Product\", width: 220 },\n        { name: \"total\", caption: \"Total\", width: 120, textAlign: \"end\" }\n    ],\n    groupColumns: [\"region\"],\n    stickyGroupRows: true\n});\ngrid.dom.style.height = \"360px\";\ngrid.refresh();\ngrid.mount(document.body);",
      "code": "with (Elgora) {\nfunction createDemo() {\n    const rows = [\n        { region: \"West\", product: \"Keyboard\", total: 356 },\n        { region: \"East\", product: \"Monitor\", total: 498 },\n        { region: \"West\", product: \"Webcam\", total: 483 },\n        { region: \"East\", product: \"Dock\", total: 537 },\n        { region: \"North\", product: \"Mouse\", total: 118 },\n        { region: \"North\", product: \"Keyboard\", total: 267 }\n    ];\n    const grid = new DataGrid({\n        data: rows,\n        columns: [\n            { name: \"region\", caption: \"Region\", width: 140, groupInterval: \"firstChar\" },\n            { name: \"product\", caption: \"Product\", width: 220 },\n            { name: \"total\", caption: \"Total\", width: 120, textAlign: \"end\" }\n        ],\n        groupColumns: [\"region\"],\n        stickyGroupRows: true\n    });\n    grid.dom.style.height = \"360px\";\n    grid.refresh();\n    grid.mount(document.body);\n}\ncreateDemo();\n}",
      "height": "360px"
    }
  ]
};
