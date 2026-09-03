export default {
  "id": "datagrid-performance",
  "title": "Virtualization and performance",
  "path": "/components/datagrid/performance",
  "group": "components",
  "parent": "datagrid",
  "order": 62,
  "description": "Render large datasets efficiently with virtual rows, paging, and reusable cell content.",
  "toc": true,
  "api": [
    "DataGrid",
    "VirtualList",
    "DataSource"
  ],
  "keywords": [
    "virtualization",
    "performance",
    "large data",
    "paging"
  ],
  "html": "<h1>Virtualization and performance</h1>\n<p>DataGrid virtualizes its body and requests only the rows needed for the\nviewport. This keeps the DOM small even when the logical dataset contains many\nrecords.</p>\n<div data-live-demo=\"datagrid-performance\"></div>Use a `DataSource` for paging or remote loading, keep custom renderers focused,\nand avoid recreating expensive objects during every cell render. The grid also\nsupports abortable data requests through the source query contract.\n<h2>API reference</h2>\n<p>See <a href=\"?!=/api-reference/DataGrid\"><code>DataGrid</code></a>, <a href=\"?!=/api-reference/DataSource\"><code>DataSource</code></a>,\nand <a href=\"?!=/api-reference/VirtualList\"><code>VirtualList</code></a>.</p>\n",
  "demos": [
    {
      "id": "datagrid-performance",
      "source": "const rows = Array.from({ length: 100000 }, (_, index) => ({\n    id: index + 1,\n    name: `Generated record ${index + 1}`,\n    score: (index * 17) % 1000\n}));\nconst grid = new DataGrid({\n    data: new ArrayDataSource(rows),\n    pageSize: 100,\n    columns: [\n        { name: \"id\", caption: \"ID\", width: 80, textAlign: \"end\" },\n        { name: \"name\", caption: \"Name\", width: 280 },\n        { name: \"score\", caption: \"Score\", width: 110, textAlign: \"end\" }\n    ]\n});\ngrid.dom.style.height = \"360px\";\ngrid.refresh();\ngrid.mount(document.body);",
      "code": "with (Elgora) {\nfunction createDemo() {\n    const rows = Array.from({ length: 100000 }, (_, index) => ({\n        id: index + 1,\n        name: `Generated record ${index + 1}`,\n        score: (index * 17) % 1000\n    }));\n    const grid = new DataGrid({\n        data: new ArrayDataSource(rows),\n        pageSize: 100,\n        columns: [\n            { name: \"id\", caption: \"ID\", width: 80, textAlign: \"end\" },\n            { name: \"name\", caption: \"Name\", width: 280 },\n            { name: \"score\", caption: \"Score\", width: 110, textAlign: \"end\" }\n        ]\n    });\n    grid.dom.style.height = \"360px\";\n    grid.refresh();\n    grid.mount(document.body);\n}\ncreateDemo();\n}",
      "height": "360px"
    }
  ]
};
