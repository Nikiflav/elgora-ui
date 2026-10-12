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
  "definition": "{ success: true } | {\n    success: false;\n    error: string;\n    /** Optional field-specific validation messages, e.g. { quantity: \"Must be positive\" }. */\n    fieldErrors?: Record<string, string>;\n}"
};
