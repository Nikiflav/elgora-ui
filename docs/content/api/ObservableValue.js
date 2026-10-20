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
      "description": "Current value; assignments notify synchronously only when Object.is reports a change.\nAssigns the value by reference and synchronously notifies registered listeners if it changed.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/ElgoraUI.ts",
      "kind": "property"
    },
    {
      "name": "Value",
      "type": "T",
      "description": "Current value; assignments notify synchronously only when Object.is reports a change.\nAssigns the value by reference and synchronously notifies registered listeners if it changed.",
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
          "text": "fn Receives subsequent changes only. Read Value explicitly for the current value."
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
          "description": "Receives subsequent changes only. Read Value explicitly for the current value."
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
      "name": "__@toPrimitive@52",
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
      "description": "Returns the current value for JavaScript value conversion.",
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
