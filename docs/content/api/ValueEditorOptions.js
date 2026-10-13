export default {
  "name": "ValueEditorOptions",
  "kind": "interface",
  "type": "ValueEditorOptions<T>",
  "description": "Configuration shared by editors in forms, grids and standalone controls.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/ValueEditorOptions",
  "source": "src/components/editors/ValueEditor.ts",
  "members": [
    {
      "name": "value",
      "type": "T",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    },
    {
      "name": "readOnly",
      "type": "boolean | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    },
    {
      "name": "disabled",
      "type": "boolean | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    },
    {
      "name": "label",
      "type": "string | undefined",
      "description": "Accessible name for the input or button.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    },
    {
      "name": "equals",
      "type": "((left: T, right: T) => boolean) | undefined",
      "description": "Compares values without cloning them; defaults to Object.is.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    },
    {
      "name": "resolveText",
      "type": "((text: string) => T | Promise<T>) | undefined",
      "description": "Converts external text to a value without changing editor state or saving.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    },
    {
      "name": "validate",
      "type": "((value: T) => string | undefined | Promise<string | undefined>) | undefined",
      "description": "Returns an error message, or undefined when the value is valid.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    },
    {
      "name": "onCommit",
      "type": "((value: T, editor: ValueEditor<T>) => void | Promise<void>) | undefined",
      "description": "Accepts a value externally. Rejection leaves the edit available for retry.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    }
  ]
};
