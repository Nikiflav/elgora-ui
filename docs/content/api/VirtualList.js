export default {
  "name": "VirtualList",
  "kind": "class",
  "type": "VirtualList<T>",
  "description": "Efficiently renders only the visible portion of a large data collection.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Virtual List",
  "path": "/api-reference/VirtualList",
  "source": "src/components/virtual-list/VirtualList.ts",
  "members": [
    {
      "name": "scrollLeft",
      "type": "number",
      "description": "The horizontal scroll position",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/virtual-list/VirtualList.ts",
      "kind": "property"
    },
    {
      "name": "scrollTop",
      "type": "number",
      "description": "The vertical scroll position",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/virtual-list/VirtualList.ts",
      "kind": "property"
    },
    {
      "name": "viewportWidth",
      "type": "number",
      "description": "The width of the viewport",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/virtual-list/VirtualList.ts",
      "kind": "property"
    },
    {
      "name": "viewportHeight",
      "type": "number",
      "description": "The height of the viewport",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/virtual-list/VirtualList.ts",
      "kind": "property"
    },
    {
      "name": "startOffset",
      "type": "number",
      "description": "The top offset of the content",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/virtual-list/VirtualList.ts",
      "kind": "property"
    },
    {
      "name": "invalidateRow",
      "type": "(index: number) => void",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/virtual-list/VirtualList.ts",
      "parameters": [
        {
          "name": "index",
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
      "signature": "(index: number) => void"
    }
  ]
};
