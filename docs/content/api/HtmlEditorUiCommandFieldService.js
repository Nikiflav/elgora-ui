export default {
  "name": "HtmlEditorUiCommandFieldService",
  "kind": "class",
  "type": "HtmlEditorUiCommandFieldService",
  "description": "Shared field projection used by every HtmlEditor DataForm surface.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorUiCommandFieldService",
  "source": "src/components/editors/htmleditor/HtmlEditorUiCommandFieldService.ts",
  "members": [
    {
      "name": "hideMenus",
      "type": "() => void",
      "description": "Closes the active option menu without ending its current form lifecycle.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorUiCommandFieldService.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "disposeMenus",
      "type": "() => void",
      "description": "Releases the option menu before its owning DataForm is disposed.\n\nThe menu is mounted into the active form so native popover light-dismiss\nremains local to that surface. DataForm recursively disposes mounted\ncomponents, therefore the service must release its reference before the\nform is replaced; the next button click creates a fresh menu instance.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorUiCommandFieldService.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "resolve",
      "type": "(context: HtmlEditorUiCommandTargetContext, presentation: HtmlEditorUiCommandPresentationKind) => HtmlEditorResolvedUiCommandField[]",
      "description": "Resolves fields for a presentation slot; surfaces may then choose a subset/order.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorUiCommandFieldService.ts",
      "parameters": [
        {
          "name": "context",
          "type": "HtmlEditorUiCommandTargetContext",
          "optional": false,
          "description": ""
        },
        {
          "name": "presentation",
          "type": "HtmlEditorUiCommandPresentationKind",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "HtmlEditorResolvedUiCommandField[]",
        "description": ""
      },
      "kind": "method",
      "signature": "(context: HtmlEditorUiCommandTargetContext, presentation: HtmlEditorUiCommandPresentationKind) => HtmlEditorResolvedUiCommandField[]"
    },
    {
      "name": "field",
      "type": "(binding: HtmlEditorResolvedUiCommandField, row: HtmlEditorUiCommandFormRow, presentation?: HtmlEditorUiCommandPresentationKind, action?: (commandId: string, anchor: HTMLButtonElement) => boolean) => DataViewField<HtmlEditorUiCommandFormRow>",
      "description": "Converts one resolved command field into the shared DataViewField contract.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorUiCommandFieldService.ts",
      "parameters": [
        {
          "name": "binding",
          "type": "HtmlEditorResolvedUiCommandField",
          "optional": false,
          "description": ""
        },
        {
          "name": "row",
          "type": "HtmlEditorUiCommandFormRow",
          "optional": false,
          "description": ""
        },
        {
          "name": "presentation",
          "type": "HtmlEditorUiCommandPresentationKind",
          "optional": true,
          "defaultValue": "\"basic\"",
          "description": ""
        },
        {
          "name": "action",
          "type": "((commandId: string, anchor: HTMLButtonElement) => boolean) | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "DataViewField<HtmlEditorUiCommandFormRow>",
        "description": ""
      },
      "kind": "method",
      "signature": "(binding: HtmlEditorResolvedUiCommandField, row: HtmlEditorUiCommandFormRow, presentation?: HtmlEditorUiCommandPresentationKind, action?: (commandId: string, anchor: HTMLButtonElement) => boolean) => DataViewField<HtmlEditorUiCommandFormRow>"
    },
    {
      "name": "createToolbarForm",
      "type": "(context: HtmlEditorUiCommandTargetContext, action?: (commandId: string, anchor: HTMLButtonElement) => boolean) => DataForm<HtmlEditorUiCommandFormRow> | undefined",
      "description": "Creates the horizontal toolbar form from the same command field service.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorUiCommandFieldService.ts",
      "parameters": [
        {
          "name": "context",
          "type": "HtmlEditorUiCommandTargetContext",
          "optional": false,
          "description": ""
        },
        {
          "name": "action",
          "type": "((commandId: string, anchor: HTMLButtonElement) => boolean) | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "DataForm<HtmlEditorUiCommandFormRow> | undefined",
        "description": ""
      },
      "kind": "method",
      "signature": "(context: HtmlEditorUiCommandTargetContext, action?: (commandId: string, anchor: HTMLButtonElement) => boolean) => DataForm<HtmlEditorUiCommandFormRow> | undefined"
    }
  ]
};
