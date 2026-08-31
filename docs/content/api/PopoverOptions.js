export default {
  "name": "PopoverOptions",
  "kind": "interface",
  "type": "PopoverOptions",
  "description": "Configuration for a native Popover API popup.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Popup",
  "path": "/api-reference/PopoverOptions",
  "source": "src/components/popup/popover.ts",
  "members": [
    {
      "name": "anchorElement",
      "type": "HTMLElement | undefined",
      "description": "Element used as the popup's positioning reference.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/popover.ts",
      "kind": "property"
    },
    {
      "name": "point",
      "type": "PopoverPoint | undefined",
      "description": "Point used as the popup's positioning reference when no anchor exists.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/popover.ts",
      "kind": "property"
    },
    {
      "name": "children",
      "type": "ComponentChild",
      "description": "Content rendered inside the popup.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/popover.ts",
      "kind": "property"
    },
    {
      "name": "placement",
      "type": "PopoverPlacement | undefined",
      "description": "Preferred side and alignment relative to the anchor.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/popover.ts",
      "kind": "property"
    },
    {
      "name": "gap",
      "type": "number | undefined",
      "description": "Distance from the anchor in pixels.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/popover.ts",
      "kind": "property"
    },
    {
      "name": "open",
      "type": "boolean | undefined",
      "description": "Whether the popup is initially opened.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/popover.ts",
      "kind": "property"
    },
    {
      "name": "closeMode",
      "type": "PopoverCloseMode | undefined",
      "description": "Native Popover API dismissal mode.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/popover.ts",
      "kind": "property"
    },
    {
      "name": "bindAnchorTarget",
      "type": "boolean | undefined",
      "description": "Whether to bind the native `popovertarget` attribute to the anchor.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/popover.ts",
      "kind": "property"
    },
    {
      "name": "onclose",
      "type": "((event: Event, popup: Popover) => void) | undefined",
      "description": "Called when the native popup closes.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/popover.ts",
      "kind": "property"
    }
  ]
};
