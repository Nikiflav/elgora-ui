export default {
  "name": "TreeViewOptions",
  "kind": "interface",
  "type": "TreeViewOptions<T>",
  "description": "Options for an independently virtualized, single-selection tree.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Tree View",
  "path": "/api-reference/TreeViewOptions",
  "source": "src/components/tree-view/TreeView.ts",
  "members": [
    {
      "name": "data",
      "type": "TreeDataAdapter<T>",
      "description": "Hierarchical data access; synchronous and asynchronous loaders share one contract.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tree-view/TreeView.ts",
      "kind": "property"
    },
    {
      "name": "getText",
      "type": "(item: T) => string",
      "description": "Accessible row label, also used for keyboard type-ahead.",
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
      "name": "renderItem",
      "type": "((context: TreeItemRenderContext<T>) => void) | undefined",
      "description": "Optional content renderer, called again when an item or its state changes.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/tree-view/TreeView.ts",
      "parameters": [
        {
          "name": "context",
          "type": "TreeItemRenderContext<T>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "((context: TreeItemRenderContext<T>) => void) | undefined"
    },
    {
      "name": "label",
      "type": "string",
      "description": "Accessible tree name.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tree-view/TreeView.ts",
      "kind": "property"
    }
  ]
};
