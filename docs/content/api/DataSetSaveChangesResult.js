export default {
  "name": "DataSetSaveChangesResult",
  "kind": "type",
  "type": "any",
  "description": "Result of saving the complete batch. Mappings apply to successfully inserted rows, grouped by table.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/DataSetSaveChangesResult",
  "source": "src/data/dataset/DataSet.ts",
  "definition": "| {\n        /** The complete batch was persisted and may be accepted locally. */\n        success: true;\n        /** Temporary-to-persisted identity mappings, keyed by table name. */\n        keyMappings?: Record<string, KeyMapping[]>;\n    }\n    | {\n        /** Saving was rejected; working changes remain available for correction and retry. */\n        success: false;\n        /** User-facing explanation of why the batch could not be saved. */\n        error: string;\n        /** Optional application-defined field validation messages, forwarded to the caller. */\n        fieldErrors?: Record<string, string>;\n    }"
};
