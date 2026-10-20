export default {
  "name": "MutationResult",
  "kind": "type",
  "type": "any",
  "description": "Result of a row mutation. Expected validation failures resolve; transport failures reject.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/MutationResult",
  "source": "src/data/DataSource.ts",
  "definition": "{\n    /** The mutation completed successfully. Persistence depends on the source implementation. */\n    success: true;\n} | {\n    /** The mutation was rejected; inspect error and optional fieldErrors. */\n    success: false;\n    /** User-facing explanation of why the mutation was rejected. */\n    error: string;\n    /** Optional field-specific validation messages, e.g. { quantity: \"Must be positive\" }. */\n    fieldErrors?: Record<string, string>;\n}"
};
