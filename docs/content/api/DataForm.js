export default {
  "name": "DataForm",
  "kind": "class",
  "type": "DataForm<TRow>",
  "description": "Compact one-object editor using the same DataViewField and field-editor contract as DataGrid.\nIt supports top/start labels, click/F2/Enter editing, async acceptance and Escape cancellation.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Dataform",
  "path": "/api-reference/DataForm",
  "source": "src/components/dataform/DataForm.ts",
  "members": [
    {
      "name": "editEnded",
      "type": "ObservableEvent<void>",
      "description": "Emitted after an accepted or cancelled editor has been disposed.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "value",
      "type": "TRow",
      "description": "Current plain-object draft or the source-owned DataRow.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "isEditing",
      "type": "boolean",
      "description": "Whether a field editor is currently accepting or cancelling a value.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "beginEditField",
      "type": "(name: string, initialText?: string) => Promise<boolean>",
      "description": "Starts editing a visible field programmatically, preserving normal DataForm editor behavior.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/dataform/DataForm.ts",
      "parameters": [
        {
          "name": "name",
          "type": "string",
          "optional": false,
          "description": ""
        },
        {
          "name": "initialText",
          "type": "string | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<boolean>",
        "description": ""
      },
      "kind": "method",
      "signature": "(name: string, initialText?: string) => Promise<boolean>"
    },
    {
      "name": "refreshField",
      "type": "(name: string) => Promise<void>",
      "description": "Refreshes one displayed field after a local form value changes.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/dataform/DataForm.ts",
      "parameters": [
        {
          "name": "name",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<void>",
        "description": ""
      },
      "kind": "method",
      "signature": "(name: string) => Promise<void>"
    },
    {
      "name": "getGroupState",
      "type": "() => ReadonlyMap<string, boolean>",
      "description": "Snapshot of current disclosure states, suitable for a replacement form's groupState option.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/dataform/DataForm.ts",
      "parameters": [],
      "returns": {
        "type": "ReadonlyMap<string, boolean>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => ReadonlyMap<string, boolean>"
    },
    {
      "name": "finishEdit",
      "type": "() => Promise<boolean>",
      "description": "Accepts the active field; failed async validation keeps its editor visible.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/dataform/DataForm.ts",
      "parameters": [],
      "returns": {
        "type": "Promise<boolean>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => Promise<boolean>"
    },
    {
      "name": "cancelEdit",
      "type": "() => boolean",
      "description": "Cancels the active field and restores its displayed value.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/dataform/DataForm.ts",
      "parameters": [],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "() => boolean"
    }
  ]
};
