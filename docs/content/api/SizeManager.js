export default {
  "name": "SizeManager",
  "kind": "interface",
  "type": "SizeManager",
  "description": "Measures virtual-list rows and maps between indexes and scroll offsets.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Virtual List",
  "path": "/api-reference/SizeManager",
  "source": "src/components/virtual-list/SizeManager.ts",
  "members": [
    {
      "name": "defaultSize",
      "type": "number",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/virtual-list/SizeManager.ts",
      "kind": "property"
    },
    {
      "name": "defaultSize",
      "type": "number",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/virtual-list/SizeManager.ts",
      "kind": "property"
    },
    {
      "name": "getSize",
      "type": "(index: number) => number",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/virtual-list/SizeManager.ts",
      "parameters": [
        {
          "name": "index",
          "type": "number",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "number",
        "description": ""
      },
      "kind": "method",
      "signature": "(index: number) => number"
    },
    {
      "name": "update",
      "type": "(index: number, newSize: number) => void",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/virtual-list/SizeManager.ts",
      "parameters": [
        {
          "name": "index",
          "type": "number",
          "optional": false,
          "description": ""
        },
        {
          "name": "newSize",
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
      "signature": "(index: number, newSize: number) => void"
    },
    {
      "name": "getOffset",
      "type": "(index: number) => number",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/virtual-list/SizeManager.ts",
      "parameters": [
        {
          "name": "index",
          "type": "number",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "number",
        "description": ""
      },
      "kind": "method",
      "signature": "(index: number) => number"
    },
    {
      "name": "findIndex",
      "type": "(offset: number) => number",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/virtual-list/SizeManager.ts",
      "parameters": [
        {
          "name": "offset",
          "type": "number",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "number",
        "description": ""
      },
      "kind": "method",
      "signature": "(offset: number) => number"
    }
  ]
};
