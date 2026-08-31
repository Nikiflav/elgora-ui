export default {
  "name": "Observable",
  "kind": "interface",
  "type": "Observable<T>",
  "description": "A subscribable source of values or events.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Core",
  "path": "/api-reference/Observable",
  "source": "src/core/ElgoraUI.ts",
  "members": [
    {
      "name": "subscribe",
      "type": "(fn: ObservableHandler<T>) => Disposable",
      "description": "",
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
    }
  ]
};
