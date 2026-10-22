export default {
  "name": "ValueEditor",
  "kind": "class",
  "type": "ValueEditor<T>",
  "description": "Value-editing lifecycle independent of rows and data sources.\nValues are retained by reference. The host decides whether accepting a value\nupdates a local model or saves it elsewhere.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/ValueEditor",
  "source": "src/components/editors/ValueEditor.ts",
  "members": [
    {
      "name": "locale",
      "type": "string",
      "description": "Locale captured at creation, stable throughout this editor's lifetime. Does not select a numeric/boolean parser.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    },
    {
      "name": "input",
      "type": "ObservableEvent<void>",
      "description": "Notifies about user input, before validation or confirmation.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    },
    {
      "name": "committed",
      "type": "ObservableEvent<T>",
      "description": "Notifies after successful external acceptance.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    },
    {
      "name": "cancelled",
      "type": "ObservableEvent<void>",
      "description": "Notifies after restoring the last accepted value.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    },
    {
      "name": "value",
      "type": "T",
      "description": "Current typed value. Text editors may additionally contain unparsed text.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    },
    {
      "name": "confirmedValue",
      "type": "T",
      "description": "Last successfully accepted value, also used by cancel().",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    },
    {
      "name": "modified",
      "type": "boolean",
      "description": "Whether the current draft differs from the accepted value.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    },
    {
      "name": "busy",
      "type": "boolean",
      "description": "True throughout parsing, validation and the external callback.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    },
    {
      "name": "error",
      "type": "string | undefined",
      "description": "Current parsing, validation or external-acceptance error.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    },
    {
      "name": "reportError",
      "type": "(error: unknown) => void",
      "description": "Displays an asynchronous editor error without accepting or saving a value.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/ValueEditor.ts",
      "parameters": [
        {
          "name": "error",
          "type": "unknown",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(error: unknown) => void"
    },
    {
      "name": "resolveText",
      "type": "(text: string) => T | Promise<T>",
      "description": "Converts text into a typed value, or throws/rejects when it cannot be resolved.\nDoes not modify draft, error, busy or confirmation state, invoke validation,\nemit events or save. Hosts can use this independently for clipboard paste.",
      "tags": [
        {
          "name": "example",
          "text": "const value = await editor.resolveText(clipboardText);"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/ValueEditor.ts",
      "parameters": [
        {
          "name": "text",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "T | Promise<T>",
        "description": ""
      },
      "kind": "method",
      "signature": "(text: string) => T | Promise<T>"
    },
    {
      "name": "validateValue",
      "type": "(value: T) => Promise<string | undefined>",
      "description": "Validates an external candidate without accepting it or changing editor state.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/ValueEditor.ts",
      "parameters": [
        {
          "name": "value",
          "type": "T",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<string | undefined>",
        "description": ""
      },
      "kind": "method",
      "signature": "(value: T) => Promise<string | undefined>"
    },
    {
      "name": "setValue",
      "type": "(value: T) => void",
      "description": "Loads an externally supplied value as both draft and confirmation baseline.\nDoes not invoke onCommit or input. For example: editor.setValue(order.quantity).",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/ValueEditor.ts",
      "parameters": [
        {
          "name": "value",
          "type": "T",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(value: T) => void"
    },
    {
      "name": "commit",
      "type": "() => Promise<boolean>",
      "description": "Parses, validates and awaits external acceptance. Returns false on failure.\nConcurrent calls share one operation; unchanged values do not invoke onCommit.\nFor example: if (await editor.commit()) closeDialog().",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/ValueEditor.ts",
      "parameters": [],
      "returns": {
        "type": "Promise<boolean>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => Promise<boolean>"
    },
    {
      "name": "cancel",
      "type": "() => boolean",
      "description": "Restores the last accepted value. Returns false while confirmation is running.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/ValueEditor.ts",
      "parameters": [],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "() => boolean"
    },
    {
      "name": "focus",
      "type": "() => void",
      "description": "Moves focus to the native editing control.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/ValueEditor.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    }
  ]
};
