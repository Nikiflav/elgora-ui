export default {
  "name": "TreeDataAdapter",
  "kind": "interface",
  "type": "TreeDataAdapter<T>",
  "description": "Reads a hierarchy without requiring a separate TreeNode model. Keys are globally unique.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Tree View",
  "path": "/api-reference/TreeDataAdapter",
  "source": "src/components/tree-view/TreeView.ts",
  "members": [
    {
      "name": "getKey",
      "type": "(item: T) => string",
      "description": "Stable identity, unique throughout this tree.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tree-view/TreeView.ts",
      "parameters": [
        {
          "name": "item",
          "type": "T",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "string",
        "description": ""
      },
      "kind": "method",
      "signature": "(item: T) => string"
    },
    {
      "name": "hasChildren",
      "type": "(item: T) => boolean",
      "description": "Indicates expandability before children have been loaded.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tree-view/TreeView.ts",
      "parameters": [
        {
          "name": "item",
          "type": "T",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(item: T) => boolean"
    },
    {
      "name": "getChildren",
      "type": "(item: T | undefined, signal: AbortSignal) => readonly T[] | Promise<readonly T[]>",
      "description": "undefined requests roots. All immediate children are loaded together; no pagination.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tree-view/TreeView.ts",
      "parameters": [
        {
          "name": "item",
          "type": "T | undefined",
          "optional": false,
          "description": ""
        },
        {
          "name": "signal",
          "type": "AbortSignal",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "readonly T[] | Promise<readonly T[]>",
        "description": ""
      },
      "kind": "method",
      "signature": "(item: T | undefined, signal: AbortSignal) => readonly T[] | Promise<readonly T[]>"
    }
  ]
};
