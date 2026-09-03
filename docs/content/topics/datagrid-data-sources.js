export default {
  "id": "datagrid-data-sources",
  "title": "Data sources",
  "path": "/components/datagrid/data-sources",
  "group": "components",
  "parent": "datagrid",
  "order": 58,
  "description": "Connect DataGrid to local arrays, asynchronous loaders, and remote data contracts.",
  "toc": true,
  "api": [
    "DataSource",
    "ArrayDataSource",
    "GridDataSource",
    "DataGrid"
  ],
  "keywords": [
    "data source",
    "async",
    "paging",
    "remote data"
  ],
  "html": "<h1>Data sources</h1>\n<p>The grid consumes a <code>DataSource</code> contract rather than depending on a specific\nstorage technology. <code>ArrayDataSource</code> is useful for local data; an application\ncan implement <code>loadData()</code> for an API, database, or service layer.</p>\n<div data-live-demo=\"datagrid-data-sources\"></div>The same grid options work with both local and remote sources. Queries carry\nfiltering, sorting, grouping, paging, and an `AbortSignal` for cancelled loads.\n<h2>API reference</h2>\n<p>See <a href=\"?!=/api-reference/DataSource\"><code>DataSource</code></a>,\n<a href=\"?!=/api-reference/ArrayDataSource\"><code>ArrayDataSource</code></a>, and\n<a href=\"?!=/api-reference/GridDataSource\"><code>GridDataSource</code></a>.</p>\n",
  "demos": [
    {
      "id": "datagrid-data-sources",
      "source": "const rows = Array.from({ length: 80 }, (_, index) => ({\n    id: index + 1,\n    name: `Record ${index + 1}`,\n    value: Math.round(Math.random() * 1000)\n}));\nconst grid = new DataGrid({\n    data: new ArrayDataSource(rows),\n    pageSize: 25,\n    columns: [\n        { name: \"id\", caption: \"ID\", width: 70, textAlign: \"end\" },\n        { name: \"name\", caption: \"Name\", width: 220 },\n        { name: \"value\", caption: \"Value\", width: 120, textAlign: \"end\" }\n    ]\n});\ngrid.dom.style.height = \"360px\";\ngrid.refresh();\ngrid.mount(document.body);",
      "code": "with (Elgora) {\nfunction createDemo() {\n    const rows = Array.from({ length: 80 }, (_, index) => ({\n        id: index + 1,\n        name: `Record ${index + 1}`,\n        value: Math.round(Math.random() * 1000)\n    }));\n    const grid = new DataGrid({\n        data: new ArrayDataSource(rows),\n        pageSize: 25,\n        columns: [\n            { name: \"id\", caption: \"ID\", width: 70, textAlign: \"end\" },\n            { name: \"name\", caption: \"Name\", width: 220 },\n            { name: \"value\", caption: \"Value\", width: 120, textAlign: \"end\" }\n        ]\n    });\n    grid.dom.style.height = \"360px\";\n    grid.refresh();\n    grid.mount(document.body);\n}\ncreateDemo();\n}",
      "height": "360px"
    }
  ]
};
