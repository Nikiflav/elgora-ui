export default {
  "name": "LocalizedMessages",
  "kind": "interface",
  "type": "LocalizedMessages",
  "description": "Message view that may follow a component's locale or retain an editor's locale snapshot.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Types",
  "path": "/api-reference/LocalizedMessages",
  "source": "src/localization/Messages.ts",
  "members": [
    {
      "name": "text",
      "type": "<K extends MessageKey>(key: K, ...args: MessageArguments<K>) => string",
      "description": "Resolves a typed full key. The result is plain text, never HTML.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/localization/Messages.ts",
      "parameters": [
        {
          "name": "key",
          "type": "K",
          "optional": false,
          "description": ""
        },
        {
          "name": "args",
          "type": "MessageArguments<K>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "string",
        "description": ""
      },
      "kind": "method",
      "signature": "<K extends MessageKey>(key: K, ...args: MessageArguments<K>) => string"
    },
    {
      "name": "scope",
      "type": "<N extends MessageNamespace>(namespace: N) => MessageScope<N>",
      "description": "Returns a typed, prefix-limited message view.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/localization/Messages.ts",
      "parameters": [
        {
          "name": "namespace",
          "type": "N",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "MessageScope<N>",
        "description": ""
      },
      "kind": "method",
      "signature": "<N extends MessageNamespace>(namespace: N) => MessageScope<N>"
    },
    {
      "name": "describe",
      "type": "(error: unknown) => string",
      "description": "Translates library-owned structured errors; application/server errors remain unchanged.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/localization/Messages.ts",
      "parameters": [
        {
          "name": "error",
          "type": "unknown",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "string",
        "description": ""
      },
      "kind": "method",
      "signature": "(error: unknown) => string"
    }
  ]
};
