export default {
  "name": "AsyncObservableEvent",
  "kind": "class",
  "type": "AsyncObservableEvent<T>",
  "description": "Event stream that awaits subscribers sequentially, in subscription order.\ninvokeAsync() is the only dispatch method. A thrown error or rejected Promise stops dispatch\nand rejects the invocation. Different invocations are independent and may overlap.\nSubscriptions added during dispatch run on the next invocation; removed subscriptions are skipped.",
  "tags": [
    {
      "name": "example",
      "text": "const event = new AsyncObservableEvent<string>();\nconst subscription = event.subscribe(async value => { await persist(value); });\nawait event.invokeAsync(\"updated\");\nsubscription.dispose();"
    }
  ],
  "topics": [],
  "group": "core",
  "namespace": "Core",
  "path": "/api-reference/AsyncObservableEvent",
  "source": "src/core/AsyncObservableEvent.ts",
  "members": [
    {
      "name": "subscribe",
      "type": "(handler: AsyncObservableHandler<T>) => Disposable",
      "description": "Registers a handler; dispose the returned subscription to unsubscribe. Duplicate handlers run once.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/AsyncObservableEvent.ts",
      "parameters": [
        {
          "name": "handler",
          "type": "AsyncObservableHandler<T>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Disposable",
        "description": ""
      },
      "kind": "method",
      "signature": "(handler: AsyncObservableHandler<T>) => Disposable"
    },
    {
      "name": "invokeAsync",
      "type": "(payload: T) => Promise<void>",
      "description": "Awaits each handler before starting the next. Failure rejects and prevents later handlers from running.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/AsyncObservableEvent.ts",
      "parameters": [
        {
          "name": "payload",
          "type": "T",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<void>",
        "description": ""
      },
      "kind": "method",
      "signature": "(payload: T) => Promise<void>"
    },
    {
      "name": "dispose",
      "type": "() => void",
      "description": "Removes subscriptions; an already running handler is still awaited and is not cancelled.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/AsyncObservableEvent.ts",
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
