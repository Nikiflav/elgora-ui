export default {
  "id": "virtual-list",
  "title": "Virtual List",
  "path": "/components/virtual-list",
  "group": "components",
  "order": 30,
  "description": "Efficiently render very large collections by keeping only the visible rows in the DOM.",
  "toc": true,
  "api": [
    "VirtualList",
    "VirtualListOptions",
    "DataList",
    "RenderRowArgs",
    "SizeManager",
    "VariableSizeManager",
    "FixedSizeManager"
  ],
  "keywords": [
    "virtual list",
    "virtualization",
    "large collections",
    "variable height"
  ],
  "html": "<h1>Virtual List</h1>\n<p><code>VirtualList</code> renders only the rows that are visible in the viewport. This keeps\nthe DOM small even when the underlying collection contains hundreds of\nthousands of items.</p>\n<h2>Variable-height rows</h2>\n<p>The demo below renders 100,000 generated rows. Each row has a different height,\nwhile <code>VirtualList</code> measures and positions only the visible portion of the\ncollection.</p>\n<div data-live-demo=\"virtual-list-overview\"></div>The data source provides random access through `getAt()` and the total number\nof rows through `count()`. `renderRow()` receives the row element, data, and\nvisible index so the application can render the row content.\n<p>See the <a href=\"?!=/api-reference/VirtualList\"><code>VirtualList</code> API reference</a>, including\n<a href=\"?!=/api-reference/VirtualListOptions\"><code>VirtualListOptions</code></a>,\n<a href=\"?!=/api-reference/DataList\"><code>DataList</code></a>, and <a href=\"?!=/api-reference/RenderRowArgs\"><code>RenderRowArgs</code></a>.</p>\n",
  "demos": [
    {
      "id": "virtual-list-overview",
      "module": "./content/components/virtual-list.md.ts",
      "source": "const host = e(\"div\", {\n    ui: [\"elg\", \"w-100\"],\n    style: { height: \"420px\", minHeight: \"420px\" }\n});\ndocument.body.append(host);\nconst rowCount = 100000;\nconst data = Array.from({ length: rowCount }, (_, index) => ({\n    id: index,\n    name: \"Row \" + index,\n    value: Math.random()\n}));\nconst virtualList = new VirtualList({\n    data: {\n        getAt(index) {\n            return data[index];\n        },\n        count() {\n            return data.length;\n        }\n    },\n    renderRow: ({ rowElement, data: row, index }) => {\n        rowElement.style.padding = \"10px\";\n        rowElement.innerText = row.name;\n        rowElement.style.background = index % 2 === 0 ? \"#ede\" : \"#fefede\";\n        rowElement.style.height = row.value * 300 + 30 + \"px\";\n    }\n});\nvirtualList.mount(host);",
      "code": "const host = e(\"div\", {\n    ui: [\"elg\", \"w-100\"],\n    style: { height: \"420px\", minHeight: \"420px\" }\n});\ndocument.body.append(host);\nconst rowCount = 100000;\nconst data = Array.from({ length: rowCount }, (_, index) => ({\n    id: index,\n    name: \"Row \" + index,\n    value: Math.random()\n}));\nconst virtualList = new VirtualList({\n    data: {\n        getAt(index) {\n            return data[index];\n        },\n        count() {\n            return data.length;\n        }\n    },\n    renderRow: ({ rowElement, data: row, index }) => {\n        rowElement.style.padding = \"10px\";\n        rowElement.innerText = row.name;\n        rowElement.style.background = index % 2 === 0 ? \"#ede\" : \"#fefede\";\n        rowElement.style.height = row.value * 300 + 30 + \"px\";\n    }\n});\nvirtualList.mount(host);",
      "height": "420px"
    }
  ]
};
