export default {
  "name": "FilterSelector",
  "kind": "type",
  "type": "any",
  "description": "A field name or a serializable transformation applied to a field.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/FilterSelector",
  "source": "src/data/filter.ts",
  "definition": "string | {\n    /** Serializable transformation name, resolved through the source's filter-function registry. */\n    function: string;\n    /** Field whose value is passed to the transformation. */\n    field: string;\n    /** Additional transformation arguments; defaults to an empty array during local evaluation. */\n    args?: unknown[];\n}"
};
