export default {
  "name": "Popover",
  "kind": "class",
  "type": "Popover",
  "description": "A native top-layer popup positioned relative to an anchor element.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Popup",
  "path": "/api-reference/Popover",
  "source": "src/components/popup/popover.ts",
  "members": [
    {
      "name": "setAnchor",
      "type": "(anchor: HTMLElement) => void",
      "description": "Changes the element used as the popup's positioning anchor.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/popup/popover.ts",
      "parameters": [
        {
          "name": "anchor",
          "type": "HTMLElement",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(anchor: HTMLElement) => void"
    },
    {
      "name": "setContent",
      "type": "(children: ComponentChild) => void",
      "description": "Replaces the content rendered inside the popover.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/popup/popover.ts",
      "parameters": [
        {
          "name": "children",
          "type": "ComponentChild",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(children: ComponentChild) => void"
    },
    {
      "name": "setPlacement",
      "type": "(placement: PopoverPlacement) => void",
      "description": "Changes the preferred placement of the popover.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/popup/popover.ts",
      "parameters": [
        {
          "name": "placement",
          "type": "PopoverPlacement",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(placement: PopoverPlacement) => void"
    },
    {
      "name": "setGap",
      "type": "(gap: number) => void",
      "description": "Changes the distance from the anchor or point.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/popup/popover.ts",
      "parameters": [
        {
          "name": "gap",
          "type": "number",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(gap: number) => void"
    },
    {
      "name": "setPoint",
      "type": "(x: number, y: number) => void",
      "description": "Changes the point used to position an anchorless popup.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/popup/popover.ts",
      "parameters": [
        {
          "name": "x",
          "type": "number",
          "optional": false,
          "description": ""
        },
        {
          "name": "y",
          "type": "number",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(x: number, y: number) => void"
    },
    {
      "name": "show",
      "type": "() => void",
      "description": "Shows the popup using the native Popover API.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/popup/popover.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "hide",
      "type": "() => void",
      "description": "Hides the popup using the native Popover API.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/popup/popover.ts",
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
      "type": "() => void",
      "description": "Toggles the popup between its open and closed states.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/popup/popover.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "isOpen",
      "type": "() => boolean",
      "description": "Returns whether the browser currently considers the popup open.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/popup/popover.ts",
      "parameters": [],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "() => boolean"
    },
    {
      "name": "dispose",
      "type": "() => void",
      "description": "Stops viewport tracking, removes the anchor marker, and releases all\ncomponent-owned listeners and subscriptions.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/popup/popover.ts",
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
