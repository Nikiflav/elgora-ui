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
      "type": "(targetId?: string) => HtmlEditorUiCommandContext",
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
        "type": "HtmlEditorUiCommandContext",
        "description": ""
      },
      "kind": "method",
      "signature": "(targetId?: string) => HtmlEditorUiCommandContext"
    },
    {
      "name": "uiCommandTargetContext",
      "type": "(nodeInfos?: readonly (string | HtmlEditorUiCommandNodeInfo)[]) => HtmlEditorUiCommandTargetContext",
      "description": "Captures inspection intent without cloning the document or changing focus.\nInspected element IDs and the remembered text range coexist. Tree navigation\ncan change the inspected elements without widening the remembered range.",
      "tags": [
        {
          "name": "example",
          "text": "const context = registry.uiCommandTargetContext([imageId]);\nconst fields = registry.getUiCommandFields(context);\n// A DataForm adapter retains a field binding until commit/cancel, then\n// submits a user-chosen value with registry.executeUiCommandField(binding, value)."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "parameters": [
        {
          "name": "nodeInfos",
          "type": "readonly (string | HtmlEditorUiCommandNodeInfo)[]",
          "optional": true,
          "defaultValue": "[]",
          "description": ""
        }
      ],
      "returns": {
        "type": "HtmlEditorUiCommandTargetContext",
        "description": ""
      },
      "kind": "method",
      "signature": "(nodeInfos?: readonly (string | HtmlEditorUiCommandNodeInfo)[]) => HtmlEditorUiCommandTargetContext"
    },
    {
      "name": "inspectionContext",
      "type": "(nodeInfos?: readonly (string | HtmlEditorUiCommandNodeInfo)[]) => HtmlEditorUiCommandTargetContext",
      "description": "",
      "tags": [
        {
          "name": "deprecated",
          "text": "Use uiCommandTargetContext."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "parameters": [
        {
          "name": "nodeInfos",
          "type": "readonly (string | HtmlEditorUiCommandNodeInfo)[]",
          "optional": true,
          "defaultValue": "[]",
          "description": ""
        }
      ],
      "returns": {
        "type": "HtmlEditorUiCommandTargetContext",
        "description": ""
      },
      "kind": "method",
      "signature": "(nodeInfos?: readonly (string | HtmlEditorUiCommandNodeInfo)[]) => HtmlEditorUiCommandTargetContext"
    },
    {
      "name": "getUiCommandFields",
      "type": "(context?: HtmlEditorUiCommandTargetContext) => HtmlEditorResolvedUiCommandField[]",
      "description": "Resolves registered command fields. Each resolver declares its own\napplication units, so alignment may bind blocks while Bold binds text\nfragments. Incomplete target sets are omitted; disabled fields stay visible.\nNo built-in contributions are migrated automatically by this scaffold.\nCapture fresh bindings after an accepted model change; do not recreate them\nhalfway through an active property edit or read them as mutable node objects.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "parameters": [
        {
          "name": "context",
          "type": "HtmlEditorUiCommandTargetContext",
          "optional": true,
          "defaultValue": "this.uiCommandTargetContext()",
          "description": ""
        }
      ],
      "returns": {
        "type": "HtmlEditorResolvedUiCommandField[]",
        "description": ""
      },
      "kind": "method",
      "signature": "(context?: HtmlEditorUiCommandTargetContext) => HtmlEditorResolvedUiCommandField[]"
    },
    {
      "name": "resolveUiCommandTargets",
      "type": "(commandId: string, context?: HtmlEditorUiCommandTargetContext) => HtmlEditorUiCommandTargets | undefined",
      "description": "Resolves preview targets for any command surface, independently of the\npresentation slot in which the command field is visible. This is used\nby overlays so a toolbar command previews its own targets rather than\nfalling back to the enclosing inspected node.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "parameters": [
        {
          "name": "commandId",
          "type": "string",
          "optional": false,
          "description": ""
        },
        {
          "name": "context",
          "type": "HtmlEditorUiCommandTargetContext",
          "optional": true,
          "defaultValue": "this.uiCommandTargetContext()",
          "description": ""
        }
      ],
      "returns": {
        "type": "HtmlEditorUiCommandTargets | undefined",
        "description": ""
      },
      "kind": "method",
      "signature": "(commandId: string, context?: HtmlEditorUiCommandTargetContext) => HtmlEditorUiCommandTargets | undefined"
    },
    {
      "name": "getInspectorFields",
      "type": "(context?: HtmlEditorUiCommandTargetContext) => HtmlEditorResolvedUiCommandField[]",
      "description": "",
      "tags": [
        {
          "name": "deprecated",
          "text": "Use getUiCommandFields."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "parameters": [
        {
          "name": "context",
          "type": "HtmlEditorUiCommandTargetContext",
          "optional": true,
          "defaultValue": "this.uiCommandTargetContext()",
          "description": ""
        }
      ],
      "returns": {
        "type": "HtmlEditorResolvedUiCommandField[]",
        "description": ""
      },
      "kind": "method",
      "signature": "(context?: HtmlEditorUiCommandTargetContext) => HtmlEditorResolvedUiCommandField[]"
    },
    {
      "name": "executeUiCommandField",
      "type": "(field: HtmlEditorResolvedUiCommandField, value?: HtmlEditorUiCommandValue) => boolean",
      "description": "Submits a captured binding through the same command dispatcher as menus and\ntoolbar. Rejects replaced definitions, stale documents and lost edit permission.\nOne command must apply all captured targets in one model transaction; never\nimplement a multi-target command as repeated calls to updateElement().",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "parameters": [
        {
          "name": "field",
          "type": "HtmlEditorResolvedUiCommandField",
          "optional": false,
          "description": ""
        },
        {
          "name": "value",
          "type": "HtmlEditorUiCommandValue | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(field: HtmlEditorResolvedUiCommandField, value?: HtmlEditorUiCommandValue) => boolean"
    },
    {
      "name": "executeInspectorField",
      "type": "(field: HtmlEditorResolvedUiCommandField, value?: HtmlEditorUiCommandValue) => boolean",
      "description": "",
      "tags": [
        {
          "name": "deprecated",
          "text": "Use executeUiCommandField."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "parameters": [
        {
          "name": "field",
          "type": "HtmlEditorResolvedUiCommandField",
          "optional": false,
          "description": ""
        },
        {
          "name": "value",
          "type": "HtmlEditorUiCommandValue | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(field: HtmlEditorResolvedUiCommandField, value?: HtmlEditorUiCommandValue) => boolean"
    },
    {
      "name": "getCommands",
      "type": "(context?: HtmlEditorUiCommandContext, includeHidden?: boolean) => HtmlEditorUiCommand[]",
      "description": "Resolves visible commands and their current enabled state for a UI surface.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "parameters": [
        {
          "name": "context",
          "type": "HtmlEditorUiCommandContext",
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
      "signature": "(context?: HtmlEditorUiCommandContext, includeHidden?: boolean) => HtmlEditorUiCommand[]"
    },
    {
      "name": "execute",
      "type": "(id: string, context?: HtmlEditorUiCommandContext, value?: HtmlEditorUiCommandValue) => boolean",
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
          "type": "HtmlEditorUiCommandContext",
          "optional": true,
          "defaultValue": "this.context()",
          "description": ""
        },
        {
          "name": "value",
          "type": "HtmlEditorUiCommandValue | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(id: string, context?: HtmlEditorUiCommandContext, value?: HtmlEditorUiCommandValue) => boolean"
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
      "name": "tooltip",
      "type": "(command: HtmlEditorUiCommand) => string",
      "description": "Returns the command tooltip, falling back to its visible label.",
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
      "type": "(command: HtmlEditorUiCommand, context: HtmlEditorUiCommandContext) => boolean",
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
          "type": "HtmlEditorUiCommandContext",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(command: HtmlEditorUiCommand, context: HtmlEditorUiCommandContext) => boolean"
    },
    {
      "name": "state",
      "type": "(command: HtmlEditorUiCommand, context: HtmlEditorUiCommandContext) => HtmlEditorUiCommandState | undefined",
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
          "type": "HtmlEditorUiCommandContext",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "HtmlEditorUiCommandState | undefined",
        "description": ""
      },
      "kind": "method",
      "signature": "(command: HtmlEditorUiCommand, context: HtmlEditorUiCommandContext) => HtmlEditorUiCommandState | undefined"
    }
  ]
};
