export default {
  "name": "LookupEditorOptions",
  "kind": "interface",
  "type": "LookupEditorOptions<TValue, TItem>",
  "description": "Lookup configuration; the host remains responsible for accepting a value.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/LookupEditorOptions",
  "source": "src/components/editors/LookupEditor.ts",
  "members": [
    {
      "name": "columns",
      "type": "DataGridColumn<TItem>[]",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/LookupEditor.ts",
      "kind": "property"
    },
    {
      "name": "loadItems",
      "type": "(query: LookupQuery) => Promise<LookupResult<TItem>>",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/LookupEditor.ts",
      "kind": "property"
    },
    {
      "name": "getItemValue",
      "type": "(item: TItem) => TValue",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/LookupEditor.ts",
      "kind": "property"
    },
    {
      "name": "getItemText",
      "type": "(item: TItem) => string",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/LookupEditor.ts",
      "kind": "property"
    },
    {
      "name": "getValueText",
      "type": "(value: TValue) => string | Promise<string>",
      "description": "Resolves a current value even when its item is not in a loaded page.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/LookupEditor.ts",
      "kind": "property"
    },
    {
      "name": "pageSize",
      "type": "number | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/LookupEditor.ts",
      "kind": "property"
    },
    {
      "name": "searchDelay",
      "type": "number | undefined",
      "description": "Search debounce in milliseconds; defaults to 150.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/LookupEditor.ts",
      "kind": "property"
    },
    {
      "name": "popupWidth",
      "type": "number | undefined",
      "description": "Explicit popup width in pixels; otherwise matches the input, with a 200px minimum.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/LookupEditor.ts",
      "kind": "property"
    },
    {
      "name": "popupHeight",
      "type": "number | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/LookupEditor.ts",
      "kind": "property"
    },
    {
      "name": "resizable",
      "type": "boolean | undefined",
      "description": "Defaults to true; resized dimensions remain for this editor instance.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/LookupEditor.ts",
      "kind": "property"
    }
  ]
};
