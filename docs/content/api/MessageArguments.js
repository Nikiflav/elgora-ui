export default {
  "name": "MessageArguments",
  "kind": "type",
  "type": "any",
  "description": "Typed argument list: messages without parameters do not require an argument object.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Types",
  "path": "/api-reference/MessageArguments",
  "source": "src/localization/Messages.ts",
  "definition": "ParametersIn<(typeof enMessages)[K]> extends never\n    ? [] : [parameters: MessageParameters<K>]"
};
