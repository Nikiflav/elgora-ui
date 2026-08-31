export default {
  "name": "c",
  "kind": "function",
  "type": "<K extends keyof HTMLElementTagNameMap>(tag: K, ...args: ComponentArgs<HTMLElementTagNameMap[K]>) => Component",
  "description": "Creates a Component backed by the requested HTML tag.\n\nChildren can be supplied either as `props.children` or as positional\narguments after the props object. When both forms are present, positional\nchildren take precedence.",
  "tags": [
    {
      "name": "example",
      "text": "c(\"button\", { ui: [\"elg\", \"btn\", \"primary\"], children: \"Save\" })\nc(\"button\", { ui: [\"elg\", \"btn\", \"primary\"] }, \"Save\")"
    }
  ],
  "topics": [],
  "group": "core",
  "namespace": "Core",
  "path": "/api-reference/c",
  "source": "src/core/c.ts",
  "parameters": [
    {
      "name": "tag",
      "type": "K",
      "optional": false,
      "description": ""
    },
    {
      "name": "args",
      "type": "ComponentArgs<HTMLElementTagNameMap[K]>",
      "optional": false,
      "description": ""
    }
  ],
  "returns": {
    "type": "Component",
    "description": ""
  }
};
