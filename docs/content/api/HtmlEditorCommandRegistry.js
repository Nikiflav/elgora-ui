export default {
  "name": "HtmlEditorCommandRegistry",
  "kind": "class",
  "type": "HtmlEditorCommandRegistry",
  "description": "Shared command registry owned by HtmlEditor and consumed by all its UI surfaces.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorCommandRegistry",
  "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
  "members": [
    {
      "name": "commandFailed",
      "type": "ObservableEvent<string>",
      "description": "Emitted when a requested command cannot be executed in its current context.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "kind": "property"
    },
    {
      "name": "register",
      "type": "(command: HtmlEditorUiCommand) => void",
      "description": "Adds or replaces an application command by its stable identifier.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "parameters": [
        {
          "name": "command",
          "type": "HtmlEditorUiCommand",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(command: HtmlEditorUiCommand) => void"
    },
    {
      "name": "context",
      "type": "(targetId?: string) => HtmlEditorCommandContext",
      "description": "Returns the current command context without copying the document.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "parameters": [
        {
          "name": "targetId",
          "type": "string | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "HtmlEditorCommandContext",
        "description": ""
      },
      "kind": "method",
      "signature": "(targetId?: string) => HtmlEditorCommandContext"
    },
    {
      "name": "inspectionContext",
      "type": "(nodeIds?: readonly string[]) => HtmlEditorInspectionContext",
      "description": "Captures inspection intent without cloning the document or changing focus.\nInspected element IDs and the remembered text range coexist. Tree navigation\ncan change the inspected elements without widening the remembered range.",
      "tags": [
        {
          "name": "example",
          "text": "const context = registry.inspectionContext([imageId]);\nconst fields = registry.getInspectorFields(context);\n// A DataForm adapter retains a field binding until commit/cancel, then\n// submits a user-chosen value with registry.executeInspectorField(binding, value)."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "parameters": [
        {
          "name": "nodeIds",
          "type": "readonly string[]",
          "optional": true,
          "defaultValue": "[]",
          "description": ""
        }
      ],
      "returns": {
        "type": "HtmlEditorInspectionContext",
        "description": ""
      },
      "kind": "method",
      "signature": "(nodeIds?: readonly string[]) => HtmlEditorInspectionContext"
    },
    {
      "name": "getInspectorFields",
      "type": "(context?: HtmlEditorInspectionContext) => HtmlEditorResolvedInspectorField[]",
      "description": "Resolves registered contributions. Element-area fields must cover every\ninspected node directly or through an ancestor owner; text-area fields use\nthe independent range. Every command\nchooses its own eligible targets, so alignment may bind blocks while Bold\nbinds text fragments. Empty scopes are omitted; disabled fields stay visible.\nNo built-in contributions are migrated automatically by this scaffold.\nCapture fresh bindings after an accepted model change; do not recreate them\nhalfway through an active property edit or read them as mutable node objects.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "parameters": [
        {
          "name": "context",
          "type": "HtmlEditorInspectionContext",
          "optional": true,
          "defaultValue": "this.inspectionContext()",
          "description": ""
        }
      ],
      "returns": {
        "type": "HtmlEditorResolvedInspectorField[]",
        "description": ""
      },
      "kind": "method",
      "signature": "(context?: HtmlEditorInspectionContext) => HtmlEditorResolvedInspectorField[]"
    },
    {
      "name": "executeInspectorField",
      "type": "(field: HtmlEditorResolvedInspectorField, value?: HtmlEditorInspectorValue) => boolean",
      "description": "Submits a captured binding through the same command dispatcher as menus and\ntoolbar. Rejects replaced definitions, stale documents and lost edit permission.\nOne command must apply all captured targets in one model transaction; never\nimplement a multi-target command as repeated calls to updateElement().",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "parameters": [
        {
          "name": "field",
          "type": "HtmlEditorResolvedInspectorField",
          "optional": false,
          "description": ""
        },
        {
          "name": "value",
          "type": "HtmlEditorInspectorValue | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(field: HtmlEditorResolvedInspectorField, value?: HtmlEditorInspectorValue) => boolean"
    },
    {
      "name": "getCommands",
      "type": "(context?: HtmlEditorCommandContext, includeHidden?: boolean) => HtmlEditorUiCommand[]",
      "description": "Resolves visible commands and their current enabled state for a UI surface.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "parameters": [
        {
          "name": "context",
          "type": "HtmlEditorCommandContext",
          "optional": true,
          "defaultValue": "this.context()",
          "description": ""
        },
        {
          "name": "includeHidden",
          "type": "boolean",
          "optional": true,
          "defaultValue": "false",
          "description": ""
        }
      ],
      "returns": {
        "type": "HtmlEditorUiCommand[]",
        "description": ""
      },
      "kind": "method",
      "signature": "(context?: HtmlEditorCommandContext, includeHidden?: boolean) => HtmlEditorUiCommand[]"
    },
    {
      "name": "execute",
      "type": "(id: string, context?: HtmlEditorCommandContext, value?: HtmlEditorInspectorValue) => boolean",
      "description": "Executes one command by id using the same registry as every menu surface.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "parameters": [
        {
          "name": "id",
          "type": "string",
          "optional": false,
          "description": ""
        },
        {
          "name": "context",
          "type": "HtmlEditorCommandContext",
          "optional": true,
          "defaultValue": "this.context()",
          "description": ""
        },
        {
          "name": "value",
          "type": "HtmlEditorInspectorValue | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(id: string, context?: HtmlEditorCommandContext, value?: HtmlEditorInspectorValue) => boolean"
    },
    {
      "name": "label",
      "type": "(command: HtmlEditorUiCommand) => string",
      "description": "Returns the localized display label for a command.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "parameters": [
        {
          "name": "command",
          "type": "HtmlEditorUiCommand",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "string",
        "description": ""
      },
      "kind": "method",
      "signature": "(command: HtmlEditorUiCommand) => string"
    },
    {
      "name": "enabled",
      "type": "(command: HtmlEditorUiCommand, context: HtmlEditorCommandContext) => boolean",
      "description": "Returns whether a command is currently enabled in a context.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "parameters": [
        {
          "name": "command",
          "type": "HtmlEditorUiCommand",
          "optional": false,
          "description": ""
        },
        {
          "name": "context",
          "type": "HtmlEditorCommandContext",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(command: HtmlEditorUiCommand, context: HtmlEditorCommandContext) => boolean"
    },
    {
      "name": "state",
      "type": "(command: HtmlEditorUiCommand, context: HtmlEditorCommandContext) => HtmlEditorMarkState | undefined",
      "description": "Returns the command's aggregate visual state.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "parameters": [
        {
          "name": "command",
          "type": "HtmlEditorUiCommand",
          "optional": false,
          "description": ""
        },
        {
          "name": "context",
          "type": "HtmlEditorCommandContext",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "HtmlEditorMarkState | undefined",
        "description": ""
      },
      "kind": "method",
      "signature": "(command: HtmlEditorUiCommand, context: HtmlEditorCommandContext) => HtmlEditorMarkState | undefined"
    }
  ]
};
