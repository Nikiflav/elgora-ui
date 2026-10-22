export default {
  "name": "ScrollReveal",
  "kind": "class",
  "type": "ScrollReveal",
  "description": "Adds entrance effects to existing HTML or component-owned elements. Observations are\nframe-batched through the UI scheduler; CSS owns the animation frames. Unsupported\nbrowsers and reduced-motion users get visible content, without a polyfill.",
  "tags": [
    {
      "name": "example",
      "text": "const reveal = new ScrollReveal(component.dom, { stagger: 60 });\ncomponent.addCleanup(reveal);\n// Mark targets with data-elg-reveal=\"fade-up\". Call refresh() after adding targets."
    }
  ],
  "topics": [],
  "group": "components",
  "namespace": "Components.Scroll Reveal",
  "path": "/api-reference/ScrollReveal",
  "source": "src/components/scroll-reveal/ScrollReveal.ts",
  "members": [
    {
      "name": "refresh",
      "type": "() => void",
      "description": "Observes newly added targets and releases removed ones; already revealed once-only targets stay visible.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scroll-reveal/ScrollReveal.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "dispose",
      "type": "() => void",
      "description": "Disconnects observers/listeners and restores owned classes/delays. Queued render work becomes a no-op.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scroll-reveal/ScrollReveal.ts",
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
