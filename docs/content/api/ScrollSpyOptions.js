export default {
  "name": "ScrollSpyOptions",
  "kind": "interface",
  "type": "ScrollSpyOptions",
  "description": "Connects existing in-page navigation links to sections in a scrollable document.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Scroll Spy",
  "path": "/api-reference/ScrollSpyOptions",
  "source": "src/components/scroll-spy/ScrollSpy.ts",
  "members": [
    {
      "name": "container",
      "type": "HTMLElement",
      "description": "Content containing the link targets. Targets must have unique IDs.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scroll-spy/ScrollSpy.ts",
      "kind": "property"
    },
    {
      "name": "navigation",
      "type": "HTMLElement",
      "description": "Navigation containing same-document anchor links.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scroll-spy/ScrollSpy.ts",
      "kind": "property"
    },
    {
      "name": "scrollContainer",
      "type": "HTMLElement | Window | undefined",
      "description": "Scroll viewport. Defaults to the content's window.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/scroll-spy/ScrollSpy.ts",
      "kind": "property"
    },
    {
      "name": "offset",
      "type": "number | undefined",
      "description": "Distance in pixels from the viewport top at which a section becomes active. Default: 24.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/scroll-spy/ScrollSpy.ts",
      "kind": "property"
    },
    {
      "name": "activeClass",
      "type": "string | undefined",
      "description": "Class applied to the current link. Default: elg-scroll-spy-active.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/scroll-spy/ScrollSpy.ts",
      "kind": "property"
    }
  ]
};
