export default {
  "name": "UndoBaselineEvent",
  "kind": "interface",
  "type": "UndoBaselineEvent",
  "description": "Register async cleanup synchronously: `event.waitUntil(dataset.rejectChanges())`.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Core",
  "path": "/api-reference/UndoBaselineEvent",
  "source": "src/core/UndoCoordinator.ts",
  "members": [
    {
      "name": "waitUntil",
      "type": "(completion: PromiseLike<void>) => void",
      "description": "Registers asynchronous baseline cleanup before the event handler returns; replay waits for completion.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "parameters": [
        {
          "name": "completion",
          "type": "PromiseLike<void>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(completion: PromiseLike<void>) => void"
    }
  ]
};
