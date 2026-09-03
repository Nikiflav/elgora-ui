export default {
  "id": "datagrid-tree",
  "title": "DataGrid tree data",
  "path": "/components/datagrid/tree",
  "group": "components",
  "parent": "datagrid",
  "order": 60,
  "description": "Render hierarchical parent and child rows in a DataGrid.",
  "toc": true,
  "api": [
    "DataGrid",
    "ArrayDataSource",
    "DataSource"
  ],
  "keywords": [
    "data grid",
    "tree",
    "hierarchy",
    "parent child"
  ],
  "html": "<h1>DataGrid tree data</h1>\n<p>A <code>DataGrid</code> can display hierarchical rows when its data source identifies the\nparent of each row. This is useful for file systems, organizational charts,\ncategories, and other nested data.</p>\n<h2>Parent and child rows</h2>\n<p>The demo uses <code>parentField: &quot;parentId&quot;</code>. Root rows have a null parent and child\nrows refer to their parent by id.</p>\n<div data-live-demo=\"datagrid-tree\"></div>\n<p>See the <a href=\"?!=/api-reference/DataGrid\"><code>DataGrid</code> API reference</a>,\n<a href=\"?!=/api-reference/ArrayDataSource\"><code>ArrayDataSource</code></a>, and\n<a href=\"?!=/api-reference/DataSource\"><code>DataSource</code></a>.</p>\n",
  "demos": [
    {
      "id": "datagrid-tree",
      "module": "./content/components/datagrid/tree.md.ts",
      "source": "const rows = [];\nlet nextId = 1;\nconst extensions = [\".txt\", \".pdf\", \".docx\", \".xlsx\", \".png\", \".jpg\", \".zip\", \".mp4\"];\nconst randomDate = () => new Date(2023, 0, 1 + Math.floor(Math.random() * 730)).toISOString().split(\"T\")[0];\nconst addFolder = (parentId, name) => {\n    const id = nextId++;\n    rows.push({ id, parentId, name, type: \"folder\", size: 0, modified: randomDate() });\n    return id;\n};\nconst addFile = (parentId, name) => rows.push({ id: nextId++, parentId, name: name + extensions[Math.floor(Math.random() * extensions.length)], type: \"file\", size: Math.floor(Math.random() * 5000000) + 1024, modified: randomDate() });\nfor (const root of [\"Documents\", \"Photos\", \"Projects\", \"Downloads\", \"Archive\"]) {\n    const rootId = addFolder(null, root);\n    for (let index = 0; index < 3; index++)\n        addFile(rootId, `file-${index + 1}`);\n    for (const child of [\"Reports\", \"Shared\", \"Archive\"]) {\n        const childId = addFolder(rootId, child);\n        for (let index = 0; index < 3; index++)\n            addFile(childId, `${child.toLowerCase()}-${index + 1}`);\n    }\n}\nconst grid = new DataGrid({\n    data: new ArrayDataSource(rows, { parentField: \"parentId\" }),\n    columns: [\n        { name: \"name\", caption: \"Name\", editorType: \"text\", width: 350, getText: async (row) => (row.type === \"folder\" ? \"📁 \" : \"📄 \") + row.name },\n        { name: \"type\", caption: \"Type\", editorType: \"text\" },\n        { name: \"size\", caption: \"Size\", editorType: \"number\", textAlign: \"end\", getText: async (row) => row.type === \"folder\" ? \"\" : `${(row.size / 1024).toFixed(1)} KB` },\n        { name: \"modified\", caption: \"Modified\", editorType: \"date\" }\n    ],\n    stickyGroupRows: true\n});\ngrid.dom.classList.add(\"elg-h-100\");\ngrid.refresh();\ngrid.mount(document.body);",
      "code": "const rows = [];\nlet nextId = 1;\nconst extensions = [\".txt\", \".pdf\", \".docx\", \".xlsx\", \".png\", \".jpg\", \".zip\", \".mp4\"];\nconst randomDate = () => new Date(2023, 0, 1 + Math.floor(Math.random() * 730)).toISOString().split(\"T\")[0];\nconst addFolder = (parentId, name) => {\n    const id = nextId++;\n    rows.push({ id, parentId, name, type: \"folder\", size: 0, modified: randomDate() });\n    return id;\n};\nconst addFile = (parentId, name) => rows.push({ id: nextId++, parentId, name: name + extensions[Math.floor(Math.random() * extensions.length)], type: \"file\", size: Math.floor(Math.random() * 5000000) + 1024, modified: randomDate() });\nfor (const root of [\"Documents\", \"Photos\", \"Projects\", \"Downloads\", \"Archive\"]) {\n    const rootId = addFolder(null, root);\n    for (let index = 0; index < 3; index++)\n        addFile(rootId, `file-${index + 1}`);\n    for (const child of [\"Reports\", \"Shared\", \"Archive\"]) {\n        const childId = addFolder(rootId, child);\n        for (let index = 0; index < 3; index++)\n            addFile(childId, `${child.toLowerCase()}-${index + 1}`);\n    }\n}\nconst grid = new DataGrid({\n    data: new ArrayDataSource(rows, { parentField: \"parentId\" }),\n    columns: [\n        { name: \"name\", caption: \"Name\", editorType: \"text\", width: 350, getText: async (row) => (row.type === \"folder\" ? \"📁 \" : \"📄 \") + row.name },\n        { name: \"type\", caption: \"Type\", editorType: \"text\" },\n        { name: \"size\", caption: \"Size\", editorType: \"number\", textAlign: \"end\", getText: async (row) => row.type === \"folder\" ? \"\" : `${(row.size / 1024).toFixed(1)} KB` },\n        { name: \"modified\", caption: \"Modified\", editorType: \"date\" }\n    ],\n    stickyGroupRows: true\n});\ngrid.dom.classList.add(\"elg-h-100\");\ngrid.refresh();\ngrid.mount(document.body);",
      "height": "420px"
    }
  ]
};
