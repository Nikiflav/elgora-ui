export default {
  "name": "UndoCoordinator",
  "kind": "class",
  "type": "UndoCoordinator",
  "description": "One chronological journal for data, views, and other application actions.",
  "tags": [
    {
      "name": "example",
      "text": "const coordinator = new UndoCoordinator();\nconst data = coordinator.createHistory(\"data\");\ndata.record({ undo: () => restoreOldValue(), redo: () => restoreNewValue() });\nawait coordinator.undo();\ncoordinator.clear(data); // after persistence; other scopes remain intact\n\nReplay is exclusive, including async baseline cleanup. A failed action keeps\nthe journal position unchanged. Observers run after committed actions; an\nobserver error does not undo that action. Event handlers must not mutate the\njournal synchronously. Returning to baseline is per scope, not per journal."
    }
  ],
  "topics": [],
  "group": "core",
  "namespace": "Core",
  "path": "/api-reference/UndoCoordinator",
  "source": "src/core/UndoCoordinator.ts",
  "members": [
    {
      "name": "changed",
      "type": "ObservableEvent<void>",
      "description": "Emitted when journal state changes. Read `busy`, `canUndo` and `canRedo`.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "kind": "property"
    },
    {
      "name": "busy",
      "type": "boolean",
      "description": "True during replay or synchronous journal notifications.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "kind": "property"
    },
    {
      "name": "canUndo",
      "type": "boolean",
      "description": "Whether a global applied operation exists.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "kind": "property"
    },
    {
      "name": "canRedo",
      "type": "boolean",
      "description": "Whether a global undone operation exists.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "kind": "property"
    },
    {
      "name": "createHistory",
      "type": "(name: string) => UndoHistory",
      "description": "Creates a separate baseline scope. Identical labels do not imply shared state.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "parameters": [
        {
          "name": "name",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "UndoHistory",
        "description": ""
      },
      "kind": "method",
      "signature": "(name: string) => UndoHistory"
    },
    {
      "name": "clear",
      "type": "(history: UndoHistory) => void",
      "description": "Establishes a new scope baseline after save/discard, removing its applied AND redo entries.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "parameters": [
        {
          "name": "history",
          "type": "UndoHistory",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(history: UndoHistory) => void"
    },
    {
      "name": "undo",
      "type": "() => Promise<boolean>",
      "description": "Undoes the last global action; e.g. `await coordinator.undo()`.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "parameters": [],
      "returns": {
        "type": "Promise<boolean>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => Promise<boolean>"
    },
    {
      "name": "redo",
      "type": "() => Promise<boolean>",
      "description": "Redoes the next global action in chronological order.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "parameters": [],
      "returns": {
        "type": "Promise<boolean>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => Promise<boolean>"
    },
    {
      "name": "ensureIdle",
      "type": "() => void",
      "description": "Call before editing to reject changes during an async undo/redo.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
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
