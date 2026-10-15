export default {
  "name": "ScrollbarsInstallation",
  "kind": "interface",
  "type": "ScrollbarsInstallation",
  "description": "Owns automatically discovered native scroll viewports in a Window or container subtree.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Scrollbar",
  "path": "/api-reference/ScrollbarsInstallation",
  "source": "src/components/scrollbar/Scrollbars.ts",
  "members": [
    {
      "name": "scrollbarMode",
      "type": "ScrollbarMode",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/Scrollbars.ts",
      "kind": "property"
    },
    {
      "name": "scrollbarHoverDistance",
      "type": "number",
      "description": "Mouse proximity threshold for every attachment owned by this installation. Defaults to 50.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/Scrollbars.ts",
      "kind": "property"
    },
    {
      "name": "refresh",
      "type": "() => void",
      "description": "Discovers new viewports and updates existing ones immediately.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/Scrollbars.ts",
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
