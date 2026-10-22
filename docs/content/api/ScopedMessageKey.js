export default {
  "name": "ScopedMessageKey",
  "kind": "type",
  "type": "any",
  "description": "Local keys available within one functional namespace.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Types",
  "path": "/api-reference/ScopedMessageKey",
  "source": "src/localization/Messages.ts",
  "definition": "MessageKey extends infer K\n    ? K extends `${N}.${infer Rest}` ? Rest : never : never"
};
