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
  "html": "<h1>Sorting</h1>\n<p>Sorting can be changed from the column context menu or configured with\n<code>orderBy</code>. Use a string for ascending order or a tuple for an explicit\ndirection.</p>\n<div data-live-demo=\"datagrid-sorting\"></div>The example starts with a two-column sort. Try the following interactions:\n<ul>\n<li>Click a column header to cycle through ascending, descending, and clear. This\nbehavior is enabled by <code>sortOnHeaderClick</code> (true by default).</li>\n<li>Hold <code>Shift</code> while clicking a header to add the column to the current sort or\nupdate only that column. The other sort columns and their priorities remain\nunchanged.</li>\n<li>Open a column’s context menu and choose <code>Sort Ascending</code>, <code>Sort Descending</code>,\nor <code>Clear sorting</code>. <code>Clear sorting</code> is not shown for grouped columns because\na grouped column must remain sorted. Holding <code>Shift</code> while choosing an action\napplies it only to the current column; without <code>Shift</code>, the selected column\nbecomes the only sort criterion.</li>\n</ul>\n<p>Dragging a header still reorders the column and does not trigger sorting. When\nmultiple columns are sorted, each header shows its sort priority.</p>\n<pre><code class=\"language-js\">grid.setOptions({ orderBy: [[&quot;region&quot;, &quot;asc&quot;], [&quot;total&quot;, &quot;desc&quot;]] });\n</code></pre>\n<h2>API reference</h2>\n<p>See <a href=\"?!=/api-reference/DataGridOptions\"><code>DataGridOptions</code></a> and\n<a href=\"?!=/api-reference/DataGrid\"><code>DataGrid</code></a>.</p>\n",
  "demos": [
    {
      "id": "datagrid-sorting",
      "module": "./content/components/datagrid/sorting.md.ts",
      "source": "const rows = [\n    { region: \"West\", product: \"Keyboard\", total: 356 },\n    { region: \"East\", product: \"Monitor\", total: 498 },\n    { region: \"West\", product: \"Webcam\", total: 483 },\n    { region: \"East\", product: \"Dock\", total: 537 },\n    { region: \"North\", product: \"Mouse\", total: 118 }\n];\nconst grid = new DataGrid({\n    data: rows,\n    columns: [\n        { name: \"region\", caption: \"Region\", width: 130 },\n        { name: \"product\", caption: \"Product\", width: 220 },\n        { name: \"total\", caption: \"Total\", width: 120, textAlign: \"end\" }\n    ],\n    orderBy: [[\"region\", \"asc\"], [\"total\", \"desc\"]]\n});\ngrid.dom.style.height = \"360px\";\ngrid.refresh();\ngrid.mount(document.body);",
      "code": "const rows = [\n    { region: \"West\", product: \"Keyboard\", total: 356 },\n    { region: \"East\", product: \"Monitor\", total: 498 },\n    { region: \"West\", product: \"Webcam\", total: 483 },\n    { region: \"East\", product: \"Dock\", total: 537 },\n    { region: \"North\", product: \"Mouse\", total: 118 }\n];\nconst grid = new DataGrid({\n    data: rows,\n    columns: [\n        { name: \"region\", caption: \"Region\", width: 130 },\n        { name: \"product\", caption: \"Product\", width: 220 },\n        { name: \"total\", caption: \"Total\", width: 120, textAlign: \"end\" }\n    ],\n    orderBy: [[\"region\", \"asc\"], [\"total\", \"desc\"]]\n});\ngrid.dom.style.height = \"360px\";\ngrid.refresh();\ngrid.mount(document.body);",
      "height": "360px"
    }
  ]
};
