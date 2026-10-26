export default {
  "name": "TreeItemRenderContext",
  "kind": "interface",
  "type": "TreeItemRenderContext<T>",
  "description": "Custom row content; disclosure, focus and selection remain owned by TreeView.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Tree View",
  "path": "/api-reference/TreeItemRenderContext",
  "source": "src/components/tree-view/TreeView.ts",
  "members": [
    {
      "name": "item",
      "type": "T",
      "description": "The original adapter item.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tree-view/TreeView.ts",
      "kind": "property"
    },
    {
      "name": "element",
      "type": "HTMLElement",
      "description": "Content host to populate; recycled hosts are cleared before rendering.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tree-view/TreeView.ts",
      "kind": "property"
    },
    {
      "name": "depth",
      "type": "number",
      "description": "Zero-based nesting depth.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tree-view/TreeView.ts",
      "kind": "property"
    },
    {
      "name": "selected",
      "type": "boolean",
      "description": "Whether this row is selected.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tree-view/TreeView.ts",
      "kind": "property"
    },
    {
      "name": "focused",
      "type": "boolean",
      "description": "Whether this row has keyboard focus within the tree.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tree-view/TreeView.ts",
      "kind": "property"
    },
    {
      "name": "expanded",
      "type": "boolean",
      "description": "Whether its branch is open.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tree-view/TreeView.ts",
      "kind": "property"
    }
  ]
};
