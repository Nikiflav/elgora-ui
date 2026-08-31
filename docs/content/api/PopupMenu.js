export default {
  "name": "PopupMenu",
  "kind": "class",
  "type": "PopupMenu",
  "description": "A dynamically rendered, nested menu backed by one native popover.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Popup",
  "path": "/api-reference/PopupMenu",
  "source": "src/components/popup/PopupMenu.ts",
  "members": [
    {
      "name": "show",
      "type": "(options: PopupMenuShowOptions) => Promise<void>",
      "description": "Renders the supplied items and opens the menu at an anchor or viewport point.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/popup/PopupMenu.ts",
      "parameters": [
        {
          "name": "options",
          "type": "PopupMenuShowOptions",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<void>",
        "description": ""
      },
      "kind": "method",
      "signature": "(options: PopupMenuShowOptions) => Promise<void>"
    },
    {
      "name": "hide",
      "type": "() => void",
      "description": "Closes the native popover menu.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/popup/PopupMenu.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "toggle",
      "type": "(options: PopupMenuShowOptions) => void",
      "description": "Opens the menu if closed, or closes it if already open.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/popup/PopupMenu.ts",
      "parameters": [
        {
          "name": "options",
          "type": "PopupMenuShowOptions",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(options: PopupMenuShowOptions) => void"
    },
    {
      "name": "isOpen",
      "type": "() => boolean",
      "description": "Returns whether the native popover is currently open.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/popup/PopupMenu.ts",
      "parameters": [],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "() => boolean"
    },
    {
      "name": "refresh",
      "type": "() => Promise<void>",
      "description": "Re-renders the current items and re-evaluates dynamic item state.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/popup/PopupMenu.ts",
      "parameters": [],
      "returns": {
        "type": "Promise<void>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => Promise<void>"
    },
    {
      "name": "dispose",
      "type": "() => void",
      "description": "Stops viewport tracking and releases all component-owned listeners.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/popup/PopupMenu.ts",
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
