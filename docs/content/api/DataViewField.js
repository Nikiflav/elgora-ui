export default {
  "name": "DataViewField",
  "kind": "interface",
  "type": "DataViewField<TRow>",
  "description": "Presentation of a data field in a form, card, list or grid.\nExtends data-access metadata with labels, formatting, editors and lookup options.\nGrid layout and rendering belong to DataGridColumn.",
  "tags": [
    {
      "name": "example",
      "text": "const product: DataViewField<Order> = {\n    name: \"product\", dataType: \"string\", caption: \"Product\", required: true\n};"
    }
  ],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/DataViewField",
  "source": "src/data/DataViewField.ts",
  "members": [
    {
      "name": "type",
      "type": "\"data\" | \"buttons\" | undefined",
      "description": "Presentation role. `data` is the default value field; `buttons` renders row actions.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "caption",
      "type": "string | undefined",
      "description": "Display label; falls back to `name` when unset.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "description",
      "type": "string | undefined",
      "description": "Field description, available to consumers as a tooltip or help text.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "tooltip",
      "type": "string | undefined",
      "description": "Optional short hint rendered as the native tooltip of the field control.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "userState",
      "type": "any",
      "description": "Opaque, caller-defined presentation metadata (not used internally).",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "readonly",
      "type": "boolean | undefined",
      "description": "Prevents editing in consumers that honor this presentation flag.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "editorButtonVisibility",
      "type": "\"hover\" | \"always\" | \"never\" | undefined",
      "description": "Controls picker trigger visibility in field consumers; forms default to always, grids to hover.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "required",
      "type": "boolean | undefined",
      "description": "Rejects missing values in the default field editor. Custom consumers may add validation.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "hideLabel",
      "type": "boolean | undefined",
      "description": "Whether a card/form consumer should omit the field label.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "showInRow",
      "type": "((row: TRow) => boolean) | undefined",
      "description": "Whether a card/form consumer should display this field for the row.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "parameters": [
        {
          "name": "row",
          "type": "TRow",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "((row: TRow) => boolean) | undefined"
    },
    {
      "name": "getText",
      "type": "((row: TRow) => Promise<string>) | undefined",
      "description": "Overrides the cell label; otherwise lookup.getValueText, displayFormat, formatValue or string conversion is used.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "parameters": [
        {
          "name": "row",
          "type": "TRow",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<string>",
        "description": ""
      },
      "kind": "method",
      "signature": "((row: TRow) => Promise<string>) | undefined"
    },
    {
      "name": "resolveText",
      "type": "((text: string, context: FieldEditContext<TRow>) => any | Promise<any>) | undefined",
      "description": "Converts external text without mutating the row. Overrides the editor's default resolver.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "parameters": [
        {
          "name": "text",
          "type": "string",
          "optional": false,
          "description": ""
        },
        {
          "name": "context",
          "type": "FieldEditContext<TRow>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "any | Promise<any>",
        "description": ""
      },
      "kind": "method",
      "signature": "((text: string, context: FieldEditContext<TRow>) => any | Promise<any>) | undefined"
    },
    {
      "name": "validate",
      "type": "((value: any, context: FieldEditContext<TRow>) => string | undefined | Promise<string | undefined>) | undefined",
      "description": "Validates both typed and picked values. Return a message to retain the edit for correction.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "parameters": [
        {
          "name": "value",
          "type": "any",
          "optional": false,
          "description": ""
        },
        {
          "name": "context",
          "type": "FieldEditContext<TRow>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "string | undefined | Promise<string | undefined>",
        "description": ""
      },
      "kind": "method",
      "signature": "((value: any, context: FieldEditContext<TRow>) => string | undefined | Promise<string | undefined>) | undefined"
    },
    {
      "name": "formatValue",
      "type": "((value: any, context: FieldEditContext<TRow>) => string) | undefined",
      "description": "Formats a value for editing and, absent getText/lookup, for display.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "parameters": [
        {
          "name": "value",
          "type": "any",
          "optional": false,
          "description": ""
        },
        {
          "name": "context",
          "type": "FieldEditContext<TRow>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "string",
        "description": ""
      },
      "kind": "method",
      "signature": "((value: any, context: FieldEditContext<TRow>) => string) | undefined"
    },
    {
      "name": "displayFormat",
      "type": "string | undefined",
      "description": "Presentation pattern for number/date fields, e.g. N0, N2, P1, C2€ or dd.MM.yyyy. It affects display and the built-in editor text, never the stored value.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "locale",
      "type": "string | undefined",
      "description": "Regional override for display and editor context. Falls back to the host locale, then Localization.default. Does not select a parser.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "lookup",
      "type": "FieldLookup<TRow, any> | undefined",
      "description": "Lookup data, labels and optional multiple result columns.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "editorButton",
      "type": "EditorButton | undefined",
      "description": "Optional picker trigger for a custom PopoverEditor; built-in editors supply their own defaults.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "buttons",
      "type": "readonly DataViewButton<TRow>[] | undefined",
      "description": "Actions rendered when `type` is `buttons`; action fields never enter value editing.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "createEditor",
      "type": "((context: FieldEditorContext<TRow>) => ValueEditor<any>) | undefined",
      "description": "Creates a specialized editor. Example: ctx => new ToggleEditor({ value: ctx.value, onCommit: ctx.onCommit }).",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "parameters": [
        {
          "name": "context",
          "type": "FieldEditorContext<TRow>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "ValueEditor<any>",
        "description": ""
      },
      "kind": "method",
      "signature": "((context: FieldEditorContext<TRow>) => ValueEditor<any>) | undefined"
    }
  ]
};
