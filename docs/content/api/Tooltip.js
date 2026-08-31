export default {
  "name": "Tooltip",
  "kind": "class",
  "type": "Tooltip",
  "description": "A universal singleton tooltip backed by one reusable Popover element.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Popup",
  "path": "/api-reference/Tooltip",
  "source": "src/components/popup/Tooltip.ts",
  "members": [
    {
      "name": "show",
      "type": "(options: TooltipShowOptions) => void",
      "description": "Shows tooltip content for an anchor, optionally after a delay.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/popup/Tooltip.ts",
      "parameters": [
        {
          "name": "options",
          "type": "TooltipShowOptions",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(options: TooltipShowOptions) => void"
    },
    {
      "name": "hide",
      "type": "(anchor?: HTMLElement) => void",
      "description": "Hides the tooltip. If an anchor is supplied, only that anchor can hide it.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/popup/Tooltip.ts",
      "parameters": [
        {
          "name": "anchor",
          "type": "HTMLElement | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(anchor?: HTMLElement) => void"
    },
    {
      "name": "isOpen",
      "type": "() => boolean",
      "description": "Returns whether the shared tooltip popover is open.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/popup/Tooltip.ts",
      "parameters": [],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "() => boolean"
    },
    {
      "name": "attach",
      "type": "(anchor: HTMLElement, content: TooltipContent, options?: Omit<TooltipShowOptions, \"anchor\" | \"content\">) => () => void",
      "description": "Adds hover and focus listeners and returns a function that removes them.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/popup/Tooltip.ts",
      "parameters": [
        {
          "name": "anchor",
          "type": "HTMLElement",
          "optional": false,
          "description": ""
        },
        {
          "name": "content",
          "type": "TooltipContent",
          "optional": false,
          "description": ""
        },
        {
          "name": "options",
          "type": "Omit<TooltipShowOptions, \"anchor\" | \"content\">",
          "optional": true,
          "defaultValue": "{}",
          "description": ""
        }
      ],
      "returns": {
        "type": "() => void",
        "description": ""
      },
      "kind": "method",
      "signature": "(anchor: HTMLElement, content: TooltipContent, options?: Omit<TooltipShowOptions, \"anchor\" | \"content\">) => () => void"
    }
  ]
};
