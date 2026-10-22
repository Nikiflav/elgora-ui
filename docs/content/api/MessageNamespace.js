export default {
  "name": "MessageNamespace",
  "kind": "type",
  "type": "any",
  "description": "Functional namespace; independent of physical files and class names.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Types",
  "path": "/api-reference/MessageNamespace",
  "source": "src/localization/Messages.ts",
  "definition": "MessageKey extends infer K ? K extends `${infer N}.${string}` ? N : never : never"
};
