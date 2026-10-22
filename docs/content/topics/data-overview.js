export default {
  "id": "data-overview",
  "title": "Overview — choosing a model",
  "path": "/data/overview",
  "group": "data",
  "order": 10,
  "description": "Choose an array, remote source or DataSet, and separate fields, input and persistence.",
  "prev": "/docs",
  "next": "/data/fields",
  "toc": true,
  "api": [],
  "keywords": [],
  "sectionRedirects": [],
  "html": "<h1>Choose a data model</h1>\n<p>The data layer can be used without DataGrid. All three models can feed a grid, a form or an application-owned view.</p>\n<h2 id=\"a-small-local-list\">A small local list</h2>\n<p>Use <a href=\"?!=/data/data-source/array\">ArrayDataSource</a> around existing objects. It queries and mutates the supplied array, preserves object identity and emits change notifications. It does not provide batch saving or undo history. Use mutation methods, or explicitly invalidate caches after external changes.</p>\n<h2 id=\"backend-owned-data\">Backend-owned data</h2>\n<p>Implement the <a href=\"?!=/data/data-source/overview\">DataSource contract</a> when the backend owns filtering, sorting, paging and acceptance. Start with the <a href=\"?!=/data/data-source/remote\">custom remote source example</a>. Only loadData is required; advertise mutation and history capabilities only when implemented.</p>\n<h2 id=\"a-local-editing-workspace\">A local editing workspace</h2>\n<p>Use <a href=\"?!=/data/dataset\">DataSet</a> for tracked DataRows, related tables, transactional business rules and undo. Tables implement DataSource, so views consume them directly. New-row insertion is local; saving and accepting changes are separate commands.</p>\n<h2 id=\"keep-responsibilities-separate\">Keep responsibilities separate</h2>\n<ul>\n<li><a href=\"?!=/data/fields\">Fields</a> define value access, presentation, conversion and lookup metadata.</li>\n<li><a href=\"?!=/components/value-editors\">Editors</a> manage input, validation and an external acceptance callback.</li>\n<li><a href=\"?!=/data/data-source/overview\">Sources</a> query and mutate working data.</li>\n<li><a href=\"?!=/components/datagrid/overview\">DataGrid</a> owns visual navigation, selection, editing and retained invalid input.</li>\n</ul>\n<p>Start with the simplest model that fits. A grid does not require a DataSet, and adding one later does not require a different grid query protocol.</p>\n",
  "headings": [
    {
      "id": "a-small-local-list",
      "title": "A small local list"
    },
    {
      "id": "backend-owned-data",
      "title": "Backend-owned data"
    },
    {
      "id": "a-local-editing-workspace",
      "title": "A local editing workspace"
    },
    {
      "id": "keep-responsibilities-separate",
      "title": "Keep responsibilities separate"
    }
  ],
  "demos": []
};
