export default {
  "id": "datagrid-selection",
  "title": "Selection",
  "path": "/components/datagrid/selection",
  "group": "components",
  "parent": "datagrid",
  "order": 57,
  "description": "Select cells, ranges, and rows with mouse and keyboard interaction.",
  "toc": true,
  "api": [
    "DataGrid",
    "SelectionManager",
    "CellSelectionState"
  ],
  "keywords": [
    "selection",
    "cell selection",
    "range selection",
    "copy"
  ],
  "html": "<h1>Selection</h1>\n<p>DataGrid supports cell and range selection. Drag across cells to select a\nrectangle, use the row header for whole-row selection, and use the context menu\nto copy the result.</p>\n<div data-live-demo=\"datagrid-selection\"></div>Selection state is rendered by the grid cell, so custom renderers do not need\nto know how selection colors or edge borders work. Applications can inspect or\nclear the current state with `getSelectedRanges()`, `getActiveSelectionCell()`,\nand `clearSelection()`.\n<h2>API reference</h2>\n<p>See <a href=\"?!=/api-reference/SelectionManager\"><code>SelectionManager</code></a>,\n<a href=\"?!=/api-reference/CellSelectionState\"><code>CellSelectionState</code></a>, and\n<a href=\"?!=/api-reference/DataGrid\"><code>DataGrid</code></a>.</p>\n",
  "demos": [
    {
      "id": "datagrid-selection",
      "source": "const rows = Array.from({ length: 12 }, (_, index) => ({\n    id: index + 1,\n    task: [\"Review\", \"Approve\", \"Export\", \"Archive\"][index % 4],\n    owner: [\"Mira\", \"Ivan\", \"Nora\"][index % 3],\n    status: index % 3 === 0 ? \"Open\" : \"Done\"\n}));\nconst grid = new DataGrid({\n    data: new ArrayDataSource(rows),\n    columns: [\n        { name: \"id\", caption: \"ID\", width: 60, textAlign: \"end\" },\n        { name: \"task\", caption: \"Task\", width: 220 },\n        { name: \"owner\", caption: \"Owner\", width: 140 },\n        { name: \"status\", caption: \"Status\", width: 120 }\n    ]\n});\ngrid.dom.style.height = \"360px\";\ngrid.refresh();\ngrid.mount(document.body);",
      "code": "with (Elgora) {\nfunction createDemo() {\n    const rows = Array.from({ length: 12 }, (_, index) => ({\n        id: index + 1,\n        task: [\"Review\", \"Approve\", \"Export\", \"Archive\"][index % 4],\n        owner: [\"Mira\", \"Ivan\", \"Nora\"][index % 3],\n        status: index % 3 === 0 ? \"Open\" : \"Done\"\n    }));\n    const grid = new DataGrid({\n        data: new ArrayDataSource(rows),\n        columns: [\n            { name: \"id\", caption: \"ID\", width: 60, textAlign: \"end\" },\n            { name: \"task\", caption: \"Task\", width: 220 },\n            { name: \"owner\", caption: \"Owner\", width: 140 },\n            { name: \"status\", caption: \"Status\", width: 120 }\n        ]\n    });\n    grid.dom.style.height = \"360px\";\n    grid.refresh();\n    grid.mount(document.body);\n}\ncreateDemo();\n}",
      "height": "360px"
    }
  ]
};
