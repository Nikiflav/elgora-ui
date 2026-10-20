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
      "description": "Application-provided scope label; names need not be unique.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "kind": "property"
    },
    {
      "name": "coordinator",
      "type": "UndoCoordinator",
      "description": "Owner of the shared chronological journal and the only entry point for replay.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "kind": "property"
    },
    {
      "name": "canUndo",
      "type": "boolean",
      "description": "Whether this scope has an applied action in the shared journal.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "kind": "property"
    },
    {
      "name": "canRedo",
      "type": "boolean",
      "description": "Whether this scope has an undone action in the shared journal.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "kind": "property"
    },
    {
      "name": "changed",
      "type": "ObservableEvent<\"record\" | \"undo\" | \"redo\" | \"clear\">",
      "description": "Reports recording, replay or clearing that affects this scope.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "kind": "property"
    },
    {
      "name": "returnedToBaseline",
      "type": "ObservableEvent<UndoBaselineEvent>",
      "description": "Emitted when undo returns this scope to its baseline, independently of other scopes.",
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
