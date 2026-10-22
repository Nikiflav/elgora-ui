export default {
  "name": "Localization",
  "kind": "class",
  "type": "Localization",
  "description": "Shared regional settings, usable independently or through the optional default singleton.\nChanging the locale emits synchronously; components own and dispose their subscriptions.\nUI dictionaries use locale → parent language → English fallback. No currency, timezone or input rules are inferred.",
  "tags": [
    {
      "name": "example",
      "text": "Localization.default.setLocale(\"bg-BG\");"
    },
    {
      "name": "example",
      "text": "const application = new Localization({ locale: \"en-US\" });"
    }
  ],
  "topics": [],
  "group": "core",
  "namespace": "Types",
  "path": "/api-reference/Localization",
  "source": "src/localization/Localization.ts",
  "members": [
    {
      "name": "default",
      "type": "Localization",
      "description": "Default context used only when a component has neither its own locale nor an application context.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/localization/Localization.ts",
      "kind": "property"
    },
    {
      "name": "changed",
      "type": "ObservableEvent<string>",
      "description": "Emits the new locale after an actual change. Does not emit on subscription.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/localization/Localization.ts",
      "kind": "property"
    },
    {
      "name": "messagesChanged",
      "type": "ObservableEvent<void>",
      "description": "Emits after messages are registered or overridden, independently of locale changes.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/localization/Localization.ts",
      "kind": "property"
    },
    {
      "name": "locale",
      "type": "string",
      "description": "Current canonical BCP 47 identifier.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/localization/Localization.ts",
      "kind": "property"
    },
    {
      "name": "setLocale",
      "type": "(locale: string | undefined) => void",
      "description": "Changes the locale, or resets to the runtime locale with undefined. Invalid identifiers leave state unchanged.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/localization/Localization.ts",
      "parameters": [
        {
          "name": "locale",
          "type": "string | undefined",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(locale: string | undefined) => void"
    },
    {
      "name": "resolveLocale",
      "type": "(options?: LocaleOptions) => string",
      "description": "Resolves an explicit override, then an application context, then the singleton. No DOM lookup or option mutation.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/localization/Localization.ts",
      "parameters": [
        {
          "name": "options",
          "type": "LocaleOptions",
          "optional": true,
          "defaultValue": "{}",
          "description": ""
        }
      ],
      "returns": {
        "type": "string",
        "description": ""
      },
      "kind": "method",
      "signature": "(options?: LocaleOptions) => string"
    },
    {
      "name": "addMessages",
      "type": "(locale: string, messages: MessageOverrides) => void",
      "description": "Merges a complete or partial dictionary for a BCP 47 language/locale. Later values override earlier ones.\nRejects unknown keys, non-string values and changed parameter names before mutating the dictionary.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/localization/Localization.ts",
      "parameters": [
        {
          "name": "locale",
          "type": "string",
          "optional": false,
          "description": ""
        },
        {
          "name": "messages",
          "type": "Partial<import(\"D:/Dev/github/elgora-ui/src/index\").Messages>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(locale: string, messages: MessageOverrides) => void"
    },
    {
      "name": "text",
      "type": "<K extends MessageKey>(key: K, ...args: MessageArguments<K>) => string",
      "description": "Resolves a typed key using this context's active locale.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/localization/Localization.ts",
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
      "description": "Creates a typed functional scope that follows this context's locale.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/localization/Localization.ts",
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
      "name": "resolveMessages",
      "type": "(options?: LocaleOptions, snapshotLocale?: string) => LocalizedMessages",
      "description": "Creates a reusable view; explicit snapshotLocale pins editor interpretation without copying dictionaries.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/localization/Localization.ts",
      "parameters": [
        {
          "name": "options",
          "type": "LocaleOptions",
          "optional": true,
          "defaultValue": "{}",
          "description": ""
        },
        {
          "name": "snapshotLocale",
          "type": "string | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "LocalizedMessages",
        "description": ""
      },
      "kind": "method",
      "signature": "(options?: LocaleOptions, snapshotLocale?: string) => LocalizedMessages"
    }
  ]
};
