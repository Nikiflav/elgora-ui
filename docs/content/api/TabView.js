export default {
  "name": "TabView",
  "kind": "class",
  "type": "TabView",
  "description": "Persistent panels with roving tab focus, arrow/Home/End navigation and native accessible relationships.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Tab View",
  "path": "/api-reference/TabView",
  "source": "src/components/tab-view/TabView.ts",
  "members": [
    {
      "name": "selectionChanged",
      "type": "ObservableEvent<string>",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tab-view/TabView.ts",
      "kind": "property"
    },
    {
      "name": "selectedId",
      "type": "string | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tab-view/TabView.ts",
      "kind": "property"
    },
    {
      "name": "select",
      "type": "(id: string) => boolean",
      "description": "Activates an enabled tab without replacing panel content or moving focus.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tab-view/TabView.ts",
      "parameters": [
        {
          "name": "id",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(id: string) => boolean"
    },
    {
      "name": "setTabText",
      "type": "(id: string, text: string) => void",
      "description": "Updates a translated label without replacing the focused tab button.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tab-view/TabView.ts",
      "parameters": [
        {
          "name": "id",
          "type": "string",
          "optional": false,
          "description": ""
        },
        {
          "name": "text",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(id: string, text: string) => void"
    },
    {
      "name": "getPanel",
      "type": "(id: string) => HTMLElement | undefined",
      "description": "Persistent panel host, suitable for updating its contents.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/tab-view/TabView.ts",
      "parameters": [
        {
          "name": "id",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "HTMLElement | undefined",
        "description": ""
      },
      "kind": "method",
      "signature": "(id: string) => HTMLElement | undefined"
    }
  ]
};
