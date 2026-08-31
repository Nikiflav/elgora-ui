export default {
  "name": "ObservableEvent",
  "kind": "class",
  "type": "ObservableEvent<T>",
  "description": "Observable event stream whose payload is emitted explicitly by the caller.",
  "tags": [],
  "topics": [],
  "group": "core",
  "namespace": "Core",
  "path": "/api-reference/ObservableEvent",
  "source": "src/core/ElgoraUI.ts",
  "members": [
    {
      "name": "subscribe",
      "type": "(fn: ObservableHandler<T>) => Disposable",
      "description": "Subscribe to event",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/ElgoraUI.ts",
      "parameters": [
        {
          "name": "fn",
          "type": "ObservableHandler<T>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Disposable",
        "description": ""
      },
      "kind": "method",
      "signature": "(fn: ObservableHandler<T>) => Disposable"
    },
    {
      "name": "invoke",
      "type": "(payload: T) => void",
      "description": "Invoke event",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/ElgoraUI.ts",
      "parameters": [
        {
          "name": "payload",
          "type": "T",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(payload: T) => void"
    },
    {
      "name": "dispose",
      "type": "() => void",
      "description": "Clear all handlers",
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
    }
  ]
};
