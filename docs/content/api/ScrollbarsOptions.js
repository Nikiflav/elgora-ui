export default {
  "name": "ScrollbarsOptions",
  "kind": "interface",
  "type": "ScrollbarsOptions",
  "description": "Presentation shared with ScrollEngine; native browser scrolling remains enabled.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Scrollbar",
  "path": "/api-reference/ScrollbarsOptions",
  "source": "src/components/scrollbar/Scrollbars.ts",
  "members": [
    {
      "name": "scrollbarMode",
      "type": "ScrollbarMode | undefined",
      "description": "Defaults to thin. Applies to every scrollbar owned by an installation.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/scrollbar/Scrollbars.ts",
      "kind": "property"
    },
    {
      "name": "scrollbarHoverDistance",
      "type": "number | undefined",
      "description": "Mouse proximity in CSS pixels that expands each scrollbar independently. Defaults to 50.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/scrollbar/Scrollbars.ts",
      "kind": "property"
    }
  ]
};
