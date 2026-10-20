export default {
  "name": "ScrollEngineOptions",
  "kind": "interface",
  "type": "ScrollEngineOptions",
  "description": "Presentation options for an existing scroll viewport.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Scrollbar",
  "path": "/api-reference/ScrollEngineOptions",
  "source": "src/components/scrollbar/scroll-engine.ts",
  "members": [
    {
      "name": "scrollbarMode",
      "type": "ScrollbarMode | undefined",
      "description": "Thin at rest, hidden until interaction, or always full-width. Defaults to thin.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/scrollbar/scroll-engine.ts",
      "kind": "property"
    },
    {
      "name": "scrollbarHoverDistance",
      "type": "number | undefined",
      "description": "Mouse proximity in CSS pixels that expands each scrollbar independently. Defaults to 50.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/scrollbar/scroll-engine.ts",
      "kind": "property"
    },
    {
      "name": "verticalScrollbarTop",
      "type": "number | undefined",
      "description": "Space above the vertical scrollbar track, in CSS pixels, for fixed headers. Defaults to 0.\nAffects track/thumb geometry only; virtual scroll coordinates and range stay unchanged.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/scrollbar/scroll-engine.ts",
      "kind": "property"
    }
  ]
};
