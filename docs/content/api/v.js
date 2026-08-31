export default {
  "name": "v",
  "kind": "function",
  "type": "<K extends keyof HTMLElementTagNameMap>(tag: K, ...args: VNodeArgs<HTMLElementTagNameMap[K]>) => VNode<HTMLElementTagNameMap[K]>",
  "description": "Creates a virtual element description for keyed or deferred DOM rendering.",
  "tags": [],
  "topics": [],
  "group": "core",
  "namespace": "Core",
  "path": "/api-reference/v",
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
      "type": "VNodeArgs<HTMLElementTagNameMap[K]>",
      "optional": false,
      "description": ""
    }
  ],
  "returns": {
    "type": "VNode<HTMLElementTagNameMap[K]>",
    "description": ""
  }
};
