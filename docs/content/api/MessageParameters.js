export default {
  "name": "MessageParameters",
  "kind": "type",
  "type": "any",
  "description": "Named parameters required by a message; parameter names are inferred from the English template.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Types",
  "path": "/api-reference/MessageParameters",
  "source": "src/localization/Messages.ts",
  "definition": "{ [P in ParametersIn<(typeof enMessages)[K]>]: string | number }"
};
