export default {
  "name": "DataList",
  "kind": "interface",
  "type": "VirtualDataSource<T>",
  "description": "Random-access data source consumed by a VirtualList.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Virtual List",
  "path": "/api-reference/DataList",
  "source": "src/components/virtual-list/VirtualList.ts",
  "members": [
    {
      "name": "count",
      "type": "() => number",
      "description": "Current total item count used for virtual scroll geometry.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/virtual-list/VirtualList.ts",
      "parameters": [],
      "returns": {
        "type": "number",
        "description": ""
      },
      "kind": "method",
      "signature": "() => number"
    },
    {
      "name": "getAt",
      "type": "(index: number) => T | undefined",
      "description": "Returns an item at a zero-based index, or undefined while unavailable.",
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
        "type": "T | undefined",
        "description": ""
      },
      "kind": "method",
      "signature": "(index: number) => T | undefined"
    }
  ]
};
