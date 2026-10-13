export default {
  "name": "ArrayDataSourceOptions",
  "kind": "interface",
  "type": "ArrayDataSourceOptions<T>",
  "description": "Identity, defaults and query configuration for an editable in-memory array.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/ArrayDataSourceOptions",
  "source": "src/data/ArrayDataSource.ts",
  "members": [
    {
      "name": "parentField",
      "type": "string | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/ArrayDataSource.ts",
      "kind": "property"
    },
    {
      "name": "idField",
      "type": "string | undefined",
      "description": "Identity field for new rows. Default: id. Existing rows are edited by reference.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/ArrayDataSource.ts",
      "kind": "property"
    },
    {
      "name": "filterFunctions",
      "type": "FilterFunctionRegistry | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/ArrayDataSource.ts",
      "kind": "property"
    },
    {
      "name": "defaults",
      "type": "Partial<T> | (() => Partial<T> | Promise<Partial<T>>) | undefined",
      "description": "Initial values for new plain-object rows. A factory runs independently for every session.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/ArrayDataSource.ts",
      "kind": "property"
    },
    {
      "name": "createRowId",
      "type": "((source: ArrayDataSource<T>) => RowIdentity | Promise<RowIdentity>) | undefined",
      "description": "Generates a string or finite number identity; defaults to crypto.randomUUID().",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/ArrayDataSource.ts",
      "kind": "property"
    }
  ]
};
