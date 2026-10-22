export default {
  "name": "LocalizedError",
  "kind": "class",
  "type": "LocalizedError<K>",
  "description": "Library-owned message error. Retains a key/parameters instead of reverse-translating English strings.\nIts default message stays English for non-UI callers; a component's message view localizes it.",
  "tags": [],
  "topics": [],
  "group": "core",
  "namespace": "Types",
  "path": "/api-reference/LocalizedError",
  "source": "src/localization/Messages.ts",
  "members": [
    {
      "name": "parameters",
      "type": "Record<string, string | number> | undefined",
      "description": "Named data for the message; not HTML and never evaluated as code.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/localization/Messages.ts",
      "kind": "property"
    }
  ]
};
