export default {
  "name": "UndoHistory",
  "kind": "interface",
  "type": "UndoHistory",
  "description": "One recording scope. Only its coordinator can execute or clear history.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Core",
  "path": "/api-reference/UndoHistory",
  "source": "src/core/UndoCoordinator.ts",
  "members": [
    {
      "name": "name",
      "type": "string",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "kind": "property"
    },
    {
      "name": "coordinator",
      "type": "UndoCoordinator",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "kind": "property"
    },
    {
      "name": "canUndo",
      "type": "boolean",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "kind": "property"
    },
    {
      "name": "canRedo",
      "type": "boolean",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "kind": "property"
    },
    {
      "name": "changed",
      "type": "ObservableEvent<\"record\" | \"undo\" | \"redo\" | \"clear\">",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "kind": "property"
    },
    {
      "name": "returnedToBaseline",
      "type": "ObservableEvent<UndoBaselineEvent>",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "kind": "property"
    },
    {
      "name": "record",
      "type": "(operation: UndoOperation) => void",
      "description": "Records an applied action, e.g. `scope.record({ undo, redo })`.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "parameters": [
        {
          "name": "operation",
          "type": "UndoOperation",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(operation: UndoOperation) => void"
    }
  ]
};
