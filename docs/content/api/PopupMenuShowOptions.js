export default {
  "name": "PopupMenuShowOptions",
  "kind": "interface",
  "type": "PopupMenuShowOptions",
  "description": "Positioning and content supplied when a PopupMenu is opened.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Popup",
  "path": "/api-reference/PopupMenuShowOptions",
  "source": "src/components/popup/PopupMenu.ts",
  "members": [
    {
      "name": "items",
      "type": "readonly MenuItem[]",
      "description": "Items rendered for this invocation.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/popup/PopupMenu.ts",
      "kind": "property"
    },
    {
      "name": "anchor",
      "type": "HTMLElement | undefined",
      "description": "Element used as the menu's positioning reference.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/PopupMenu.ts",
      "kind": "property"
    },
    {
      "name": "point",
      "type": "PopoverPoint | undefined",
      "description": "Viewport point used when showing a context menu.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/PopupMenu.ts",
      "kind": "property"
    },
    {
      "name": "placement",
      "type": "PopoverPlacement | undefined",
      "description": "Preferred side and alignment relative to the anchor or point.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/PopupMenu.ts",
      "kind": "property"
    },
    {
      "name": "gap",
      "type": "number | undefined",
      "description": "Distance from the positioning reference in pixels.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/PopupMenu.ts",
      "kind": "property"
    },
    {
      "name": "closeMode",
      "type": "PopoverCloseMode | undefined",
      "description": "Native popover dismissal mode.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/PopupMenu.ts",
      "kind": "property"
    }
  ]
};
