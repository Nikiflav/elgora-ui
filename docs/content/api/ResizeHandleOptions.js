export default {
  "name": "ResizeHandleOptions",
  "kind": "interface",
  "type": "ResizeHandleOptions",
  "description": "Reusable bottom-right resize behavior for a panel, popover or other element.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Resize",
  "path": "/api-reference/ResizeHandleOptions",
  "source": "src/components/resize/ResizeHandle.ts",
  "members": [
    {
      "name": "target",
      "type": "HTMLElement",
      "description": "Positioned element resized by this grip; its dimensions are written as border-box CSS pixels.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/resize/ResizeHandle.ts",
      "kind": "property"
    },
    {
      "name": "minWidth",
      "type": "number | undefined",
      "description": "Requested minimum width in CSS pixels; available viewport space takes precedence.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/resize/ResizeHandle.ts",
      "kind": "property"
    },
    {
      "name": "minHeight",
      "type": "number | undefined",
      "description": "Requested minimum height in CSS pixels; available viewport space takes precedence.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/resize/ResizeHandle.ts",
      "kind": "property"
    },
    {
      "name": "maxWidth",
      "type": "number | undefined",
      "description": "Optional maximum width in CSS pixels, further limited by viewport space.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/resize/ResizeHandle.ts",
      "kind": "property"
    },
    {
      "name": "maxHeight",
      "type": "number | undefined",
      "description": "Optional maximum height in CSS pixels, further limited by viewport space.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/resize/ResizeHandle.ts",
      "kind": "property"
    },
    {
      "name": "viewportGap",
      "type": "number | undefined",
      "description": "Viewport inset; available space takes precedence over minimum dimensions.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/resize/ResizeHandle.ts",
      "kind": "property"
    },
    {
      "name": "onResize",
      "type": "((size: ResizeSize) => void) | undefined",
      "description": "Called after dimensions are applied during a resize gesture.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/resize/ResizeHandle.ts",
      "kind": "property"
    }
  ]
};
