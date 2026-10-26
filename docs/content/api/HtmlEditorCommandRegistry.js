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
      "name": "getCommands",
      "type": "(context?: HtmlEditorCommandContext) => HtmlEditorUiCommand[]",
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
        }
      ],
      "returns": {
        "type": "HtmlEditorUiCommand[]",
        "description": ""
      },
      "kind": "method",
      "signature": "(context?: HtmlEditorCommandContext) => HtmlEditorUiCommand[]"
    },
    {
      "name": "execute",
      "type": "(id: string, context?: HtmlEditorCommandContext) => boolean",
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
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(id: string, context?: HtmlEditorCommandContext) => boolean"
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
