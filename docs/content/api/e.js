export default {
  "name": "e",
  "kind": "function",
  "type": "<K extends keyof HTMLElementTagNameMap>(tag: K, ...args: ElementArgs<HTMLElementTagNameMap[K]>) => HTMLElementTagNameMap[K]",
  "description": "Creates a native HTML element, applies typed properties, and appends children.\n\nChildren can be supplied either as `props.children` or as positional\narguments after the props object. When both forms are present, positional\nchildren take precedence. The `children` prop is consumed as content and is\nnot written as an HTML attribute.",
  "tags": [
    {
      "name": "example",
      "text": "e(\"button\", { ui: [\"elg\", \"btn\", \"primary\"], children: \"Save\" })\ne(\"button\", { ui: [\"elg\", \"btn\", \"primary\"] }, \"Save\")"
    }
  ],
  "topics": [],
  "group": "core",
  "namespace": "Core",
  "path": "/api-reference/e",
  "source": "src/core/e.ts",
  "parameters": [
    {
      "name": "tag",
      "type": "K",
      "optional": false,
      "description": ""
    },
    {
      "name": "args",
      "type": "ElementArgs<HTMLElementTagNameMap[K]>",
      "optional": false,
      "description": ""
    }
  ],
  "returns": {
    "type": "HTMLElementTagNameMap[K]",
    "description": ""
  }
};
