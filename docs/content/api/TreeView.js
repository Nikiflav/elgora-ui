export default {
  "name": "TreeView",
  "kind": "class",
  "type": "TreeView<T>",
  "description": "Virtualized tree with lazy branch loading, cached children and independent focus/selection.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Tree View",
  "path": "/api-reference/TreeView",
  "source": "src/components/tree-view/TreeView.ts",
  "members": [
    {
      "name": "selectionChanged",
      "type": "ObservableEvent<T | undefined>",
      "description": "Emits the original selected item; undefined when selection is cleared.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tree-view/TreeView.ts",
      "kind": "property"
    },
    {
      "name": "itemActivated",
      "type": "ObservableEvent<T>",
      "description": "Emits when Enter or a double-click activates an item.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tree-view/TreeView.ts",
      "kind": "property"
    },
    {
      "name": "focusedItemChanged",
      "type": "ObservableEvent<T | undefined>",
      "description": "Emits keyboard focus changes independently of confirmed selection.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tree-view/TreeView.ts",
      "kind": "property"
    },
    {
      "name": "itemContextMenu",
      "type": "ObservableEvent<{ item: T; event: MouseEvent; }>",
      "description": "Allows a host to attach its own context menu without embedding menu policy in TreeView.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tree-view/TreeView.ts",
      "kind": "property"
    },
    {
      "name": "selectedItem",
      "type": "T | undefined",
      "description": "Current selected adapter item, if it is present in the loaded tree.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tree-view/TreeView.ts",
      "kind": "property"
    },
    {
      "name": "focusedItem",
      "type": "T | undefined",
      "description": "Current focused adapter item. Focusing does not confirm selection.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tree-view/TreeView.ts",
      "kind": "property"
    },
    {
      "name": "load",
      "type": "() => Promise<void>",
      "description": "Loads roots, sharing an in-flight request and retaining successful results.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tree-view/TreeView.ts",
      "parameters": [],
      "returns": {
        "type": "Promise<void>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => Promise<void>"
    },
    {
      "name": "isExpanded",
      "type": "(item: T) => boolean",
      "description": "Returns whether the loaded item's branch is open.",
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
      "name": "expand",
      "type": "(item: T) => Promise<void>",
      "description": "Opens an already loaded item and lazily loads its children. Errors are displayed locally.",
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
        "type": "Promise<void>",
        "description": ""
      },
      "kind": "method",
      "signature": "(item: T) => Promise<void>"
    },
    {
      "name": "collapse",
      "type": "(item: T) => void",
      "description": "Hides descendants but retains their cache and expansion state, including pending loads.",
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
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(item: T) => void"
    },
    {
      "name": "select",
      "type": "(item: T | undefined) => void",
      "description": "Selects a loaded item by key. undefined clears selection; emits only for a changed key.",
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
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(item: T | undefined) => void"
    },
    {
      "name": "reveal",
      "type": "(item: T) => Promise<boolean>",
      "description": "Opens ancestors of a known item and scrolls it into view. Does not steal DOM focus.\nUnknown remote descendants must first be loaded, e.g. by expanding their path.",
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
        "type": "Promise<boolean>",
        "description": ""
      },
      "kind": "method",
      "signature": "(item: T) => Promise<boolean>"
    },
    {
      "name": "refresh",
      "type": "(item?: T) => Promise<void>",
      "description": "Invalidates cached descendants and reloads this branch, or the entire tree.\nStable keys retain selection/expansion where their items remain present.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tree-view/TreeView.ts",
      "parameters": [
        {
          "name": "item",
          "type": "T | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<void>",
        "description": ""
      },
      "kind": "method",
      "signature": "(item?: T) => Promise<void>"
    }
  ]
};
