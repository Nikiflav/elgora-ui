export default {
  "name": "ScrollRevealOptions",
  "kind": "interface",
  "type": "ScrollRevealOptions",
  "description": "Viewport-triggered entrance animation configuration; no per-frame scroll handler is used.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Scroll Reveal",
  "path": "/api-reference/ScrollRevealOptions",
  "source": "src/components/scroll-reveal/ScrollReveal.ts",
  "members": [
    {
      "name": "selector",
      "type": "string | undefined",
      "description": "Elements to reveal within the container, including the container itself if it matches.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/scroll-reveal/ScrollReveal.ts",
      "kind": "property"
    },
    {
      "name": "effect",
      "type": "\"fade\" | \"fade-up\" | undefined",
      "description": "Default effect; data-elg-reveal=\"fade\" or \"fade-up\" overrides it for a target.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/scroll-reveal/ScrollReveal.ts",
      "kind": "property"
    },
    {
      "name": "root",
      "type": "Element | Document | null | undefined",
      "description": "Scroll viewport. Omit for the document viewport; an element enables nested scrolling.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/scroll-reveal/ScrollReveal.ts",
      "kind": "property"
    },
    {
      "name": "threshold",
      "type": "number | undefined",
      "description": "Visible fraction required to enter, between 0 and 1. Defaults to 0.15.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/scroll-reveal/ScrollReveal.ts",
      "kind": "property"
    },
    {
      "name": "rootMargin",
      "type": "string | undefined",
      "description": "Observer root margin, in IntersectionObserver syntax. Defaults to 0px.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/scroll-reveal/ScrollReveal.ts",
      "kind": "property"
    },
    {
      "name": "once",
      "type": "boolean | undefined",
      "description": "Reveal once (default) or hide/reveal again as targets leave and enter.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/scroll-reveal/ScrollReveal.ts",
      "kind": "property"
    },
    {
      "name": "stagger",
      "type": "number | undefined",
      "description": "Delay in milliseconds between sibling targets, capped at 240ms per target. Defaults to 0.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/scroll-reveal/ScrollReveal.ts",
      "kind": "property"
    }
  ]
};
