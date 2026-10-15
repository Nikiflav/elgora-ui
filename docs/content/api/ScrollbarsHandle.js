export default {
  "name": "ScrollbarsHandle",
  "kind": "interface",
  "type": "ScrollbarsHandle",
  "description": "A native scroll viewport with custom scrollbar presentation.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Scrollbar",
  "path": "/api-reference/ScrollbarsHandle",
  "source": "src/components/scrollbar/Scrollbars.ts",
  "members": [
    {
      "name": "element",
      "type": "HTMLElement",
      "description": "Scrollable element, or the document scrolling element for a Window attachment.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/Scrollbars.ts",
      "kind": "property"
    },
    {
      "name": "scrollbarMode",
      "type": "ScrollbarMode",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/Scrollbars.ts",
      "kind": "property"
    },
    {
      "name": "scrollbarHoverDistance",
      "type": "number",
      "description": "Mouse proximity threshold in CSS pixels; zero enables direct scrollbar hover only.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/Scrollbars.ts",
      "kind": "property"
    },
    {
      "name": "refresh",
      "type": "() => void",
      "description": "Rechecks dimensions and position immediately, for application-specific layout changes.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/Scrollbars.ts",
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
