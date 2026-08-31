export default {
  "name": "ScrollEngine",
  "kind": "class",
  "type": "ScrollEngine",
  "description": "Custom scroll container supporting virtual dimensions and multiple input modes.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Scrollbar",
  "path": "/api-reference/ScrollEngine",
  "source": "src/components/scrollbar/scroll-engine.ts",
  "members": [
    {
      "name": "dom",
      "type": "HTMLElement",
      "description": "The viewport element enhanced by this scroll engine.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/scroll-engine.ts",
      "kind": "property"
    },
    {
      "name": "scrollWidth",
      "type": "number",
      "description": "Total virtual content width configured for the viewport.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/scroll-engine.ts",
      "kind": "property"
    },
    {
      "name": "scrollHeight",
      "type": "number",
      "description": "Total virtual content height configured for the viewport.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/scroll-engine.ts",
      "kind": "property"
    },
    {
      "name": "scrollLeft",
      "type": "number",
      "description": "Current horizontal virtual scroll position.\nSets the horizontal virtual scroll position, clamped to valid bounds.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/scroll-engine.ts",
      "kind": "property"
    },
    {
      "name": "scrollLeft",
      "type": "number",
      "description": "Current horizontal virtual scroll position.\nSets the horizontal virtual scroll position, clamped to valid bounds.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/scroll-engine.ts",
      "kind": "property"
    },
    {
      "name": "scrollTop",
      "type": "number",
      "description": "Current vertical virtual scroll position.\nSets the vertical virtual scroll position, clamped to valid bounds.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/scroll-engine.ts",
      "kind": "property"
    },
    {
      "name": "scrollTop",
      "type": "number",
      "description": "Current vertical virtual scroll position.\nSets the vertical virtual scroll position, clamped to valid bounds.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/scroll-engine.ts",
      "kind": "property"
    },
    {
      "name": "maxScrollLeft",
      "type": "number",
      "description": "Maximum horizontal virtual scroll position.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/scroll-engine.ts",
      "kind": "property"
    },
    {
      "name": "maxScrollTop",
      "type": "number",
      "description": "Maximum vertical virtual scroll position.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/scroll-engine.ts",
      "kind": "property"
    },
    {
      "name": "clientWidth",
      "type": "number",
      "description": "Current physical viewport width in CSS pixels.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/scroll-engine.ts",
      "kind": "property"
    },
    {
      "name": "clientHeight",
      "type": "number",
      "description": "Current physical viewport height in CSS pixels.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/scroll-engine.ts",
      "kind": "property"
    },
    {
      "name": "updateDimensions",
      "type": "(scrollWidth: number, scrollHeight: number) => void",
      "description": "Updates the engine with virtual content dimensions. If a dimension exceeds\nthe browser-safe physical limit, the engine calculates an amplification ratio.",
      "tags": [
        {
          "name": "param",
          "text": "scrollWidth Total virtual content width."
        },
        {
          "name": "param",
          "text": "scrollHeight Total virtual content height."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/scroll-engine.ts",
      "parameters": [
        {
          "name": "scrollWidth",
          "type": "number",
          "optional": false,
          "description": "Total virtual content width."
        },
        {
          "name": "scrollHeight",
          "type": "number",
          "optional": false,
          "description": "Total virtual content height."
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(scrollWidth: number, scrollHeight: number) => void"
    },
    {
      "name": "scrollTo",
      "type": "(left: number, top: number) => void",
      "description": "Scrolls programmatically using virtual coordinates.",
      "tags": [
        {
          "name": "param",
          "text": "left Target horizontal virtual position."
        },
        {
          "name": "param",
          "text": "top Target vertical virtual position."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/scroll-engine.ts",
      "parameters": [
        {
          "name": "left",
          "type": "number",
          "optional": false,
          "description": "Target horizontal virtual position."
        },
        {
          "name": "top",
          "type": "number",
          "optional": false,
          "description": "Target vertical virtual position."
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(left: number, top: number) => void"
    },
    {
      "name": "onScroll",
      "type": "(callback: () => void) => void",
      "description": "Registers a callback invoked after the virtual scroll position changes.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/scroll-engine.ts",
      "parameters": [
        {
          "name": "callback",
          "type": "() => void",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(callback: () => void) => void"
    },
    {
      "name": "onResize",
      "type": "(callback: () => void) => void",
      "description": "Registers a callback invoked after the physical viewport is resized.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/scroll-engine.ts",
      "parameters": [
        {
          "name": "callback",
          "type": "() => void",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(callback: () => void) => void"
    },
    {
      "name": "dispose",
      "type": "() => void",
      "description": "Releases all event listeners, observers, animation frames, and custom\nscrollbar elements owned by the engine. The viewport and its content\nremain owned by the caller.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/scroll-engine.ts",
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
