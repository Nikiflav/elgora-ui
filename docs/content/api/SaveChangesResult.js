export default {
  "name": "SaveChangesResult",
  "kind": "type",
  "type": "any",
  "description": "Result returned after a data source processes a batch of edits.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/SaveChangesResult",
  "source": "src/data/ChangeSet.ts",
  "definition": "| {\n        /** The entire submitted batch was saved successfully. */\n        success: true;\n        /** Present when the server replaced one or more temporary insert keys. */\n        keyMappings?: KeyMapping[];\n    }\n    | {\n        /** The batch was rejected; pending changes remain available for correction. */\n        success: false;\n        /** A user-facing or application-level explanation of the rejected batch. */\n        error: string;\n    }"
};
