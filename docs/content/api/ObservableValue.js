export default {
  "name": "ObservableValue",
  "kind": "class",
  "type": "ObservableValue<T>",
  "description": "Mutable observable value that notifies subscribers when its value changes.",
  "tags": [],
  "topics": [],
  "group": "core",
  "namespace": "Core",
  "path": "/api-reference/ObservableValue",
  "source": "src/core/ElgoraUI.ts",
  "members": [
    {
      "name": "Value",
      "type": "T",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/ElgoraUI.ts",
      "kind": "property"
    },
    {
      "name": "Value",
      "type": "T",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/ElgoraUI.ts",
      "kind": "property"
    },
    {
      "name": "subscribe",
      "type": "(fn: ObservableHandler<T>) => Disposable",
      "description": "Subscribe to value changes.",
      "tags": [
        {
          "name": "param",
          "text": "fn Subscriber function to be called on value changes. Will be called immediately with the current value upon subscription."
        },
        {
          "name": "returns",
          "text": "A disposable subscription object. Dispose to unsubscribe."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/core/ElgoraUI.ts",
      "parameters": [
        {
          "name": "fn",
          "type": "ObservableHandler<T>",
          "optional": false,
          "description": "Subscriber function to be called on value changes. Will be called immediately with the current value upon subscription."
        }
      ],
      "returns": {
        "type": "Disposable",
        "description": "A disposable subscription object. Dispose to unsubscribe."
      },
      "kind": "method",
      "signature": "(fn: ObservableHandler<T>) => Disposable"
    },
    {
      "name": "dispose",
      "type": "() => void",
      "description": "Clear all subscribers",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/ElgoraUI.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "__@toPrimitive@55",
      "type": "() => any",
      "description": "Controls how object is converted to primitive",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/ElgoraUI.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => any"
    },
    {
      "name": "toString",
      "type": "() => string",
      "description": "Fallback for string conversion",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/ElgoraUI.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => string"
    },
    {
      "name": "valueOf",
      "type": "() => any",
      "description": "Returns the primitive value of the specified object.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/ElgoraUI.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => any"
    }
  ]
};
