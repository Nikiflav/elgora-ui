export default {
  "name": "PopoverStateEvent",
  "kind": "interface",
  "type": "PopoverStateEvent",
  "description": "Payload emitted after a popover has changed its visible state.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Popup",
  "path": "/api-reference/PopoverStateEvent",
  "source": "src/components/popup/popover.ts",
  "members": [
    {
      "name": "popover",
      "type": "Popover",
      "description": "Popover whose state changed.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/popup/popover.ts",
      "kind": "property"
    },
    {
      "name": "source",
      "type": "Element | null | undefined",
      "description": "Native invoker when the browser supplied one.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/popover.ts",
      "kind": "property"
    }
  ]
};
