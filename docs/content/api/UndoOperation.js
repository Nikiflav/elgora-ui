export default {
  "name": "UndoOperation",
  "kind": "interface",
  "type": "UndoOperation",
  "description": "An already-applied action. A failed replay must leave the action's state unchanged.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Core",
  "path": "/api-reference/UndoOperation",
  "source": "src/core/UndoCoordinator.ts",
  "members": [
    {
      "name": "label",
      "type": "string | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/core/UndoCoordinator.ts",
      "kind": "property"
    },
    {
      "name": "undo",
      "type": "() => void | Promise<void>",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "parameters": [],
      "returns": {
        "type": "void | Promise<void>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void | Promise<void>"
    },
    {
      "name": "redo",
      "type": "() => void | Promise<void>",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/UndoCoordinator.ts",
      "parameters": [],
      "returns": {
        "type": "void | Promise<void>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void | Promise<void>"
    },
    {
      "name": "afterReplay",
      "type": "(() => void | Promise<void>) | undefined",
      "description": "Runs after replay commits its journal position; observer failures do not reverse replay.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/core/UndoCoordinator.ts",
      "parameters": [],
      "returns": {
        "type": "void | Promise<void>",
        "description": ""
      },
      "kind": "method",
      "signature": "(() => void | Promise<void>) | undefined"
    }
  ]
};
