export default {
  "name": "Throttle",
  "kind": "class",
  "type": "Throttle<T>",
  "description": "Simple time-based throttle with trailing execution.",
  "tags": [],
  "topics": [],
  "group": "core",
  "namespace": "Core",
  "path": "/api-reference/Throttle",
  "source": "src/core/Throttle.ts",
  "members": [
    {
      "name": "call",
      "type": "(...args: Parameters<T>) => void",
      "description": "Call the throttled function.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/Throttle.ts",
      "parameters": [
        {
          "name": "args",
          "type": "Parameters<T>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(...args: Parameters<T>) => void"
    },
    {
      "name": "cancel",
      "type": "() => void",
      "description": "Cancel any pending execution.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/Throttle.ts",
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
