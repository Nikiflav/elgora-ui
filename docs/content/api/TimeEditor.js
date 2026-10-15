export default {
  "name": "TimeEditor",
  "kind": "class",
  "type": "TimeEditor",
  "description": "Text time editor with an optional mouse/touch time picker.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/TimeEditor",
  "source": "src/components/editors/TimeEditor.ts",
  "members": [
    {
      "name": "resolveText",
      "type": "(text: string) => Promise<string | null>",
      "description": "Resolves strict time text asynchronously for a consistent editor API.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/TimeEditor.ts",
      "parameters": [
        {
          "name": "text",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<string | null>",
        "description": ""
      },
      "kind": "method",
      "signature": "(text: string) => Promise<string | null>"
    }
  ]
};
