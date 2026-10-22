export default {
  "name": "setElementProps",
  "kind": "function",
  "type": "<T extends HTMLElement>(el: T, props?: ElementProps<T>, assign?: boolean) => void",
  "description": "Applies the given props to the given element.\r\nUses diff to apply only the changes.\r\nclass, className and ui are combined independently of property order. Patching\r\nremoves only their previous managed tokens, retaining unrelated DOM classes.\r\nDo not also control the same token through bindClass() or direct classList edits.",
  "tags": [
    {
      "name": "param",
      "text": "el The element to apply the props to."
    },
    {
      "name": "param",
      "text": "props The props to apply."
    },
    {
      "name": "param",
      "text": "assign If true only the provided props are modified, otherwise the not provided stored props are reset to null/default value."
    }
  ],
  "topics": [],
  "group": "core",
  "namespace": "Core",
  "path": "/api-reference/setElementProps",
  "source": "src/core/e.ts",
  "parameters": [
    {
      "name": "el",
      "type": "T",
      "optional": false,
      "description": "The element to apply the props to."
    },
    {
      "name": "props",
      "type": "ElementProps<T> | undefined",
      "optional": true,
      "description": "The props to apply."
    },
    {
      "name": "assign",
      "type": "boolean",
      "optional": true,
      "defaultValue": "false",
      "description": "If true only the provided props are modified, otherwise the not provided stored props are reset to null/default value."
    }
  ],
  "returns": {
    "type": "void",
    "description": ""
  }
};
