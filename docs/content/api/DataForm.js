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
