export default {
  "name": "DisplayValue",
  "kind": "type",
  "type": "any",
  "description": "One selectable option for a column's allowed-value list (e.g. a dropdown item).",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/DisplayValue",
  "source": "src/data/DataViewField.ts",
  "definition": "{\n    /** Stored value represented by the option. */\n    value: any,\n    /** Human-readable label for the option. */\n    text: string,\n    /** Optional CSS color associated with the option. */\n    color?: string;\n    /** Optional icon class name for consumers that render option icons. */\n    icon?: string;\n    /** Optional image URL for consumers that render option images. */\n    image?: string;\n}"
};
