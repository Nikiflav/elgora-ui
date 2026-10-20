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
      "description": "Result-grid columns; use one text column for a simple list or several for richer lookup items.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/LookupEditor.ts",
      "kind": "property"
    },
    {
      "name": "loadItems",
      "type": "(query: LookupQuery) => Promise<LookupResult<TItem>>",
      "description": "Loads a matching page and total count. Honor abortSignal to cancel obsolete remote requests.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/LookupEditor.ts",
      "kind": "property"
    },
    {
      "name": "getItemValue",
      "type": "(item: TItem) => TValue",
      "description": "Maps a chosen lookup item to the value accepted by the editor.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/LookupEditor.ts",
      "kind": "property"
    },
    {
      "name": "getItemText",
      "type": "(item: TItem) => string",
      "description": "Returns the item's label, also used for exact-text resolution.",
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
      "description": "Maximum items requested per result page. Defaults to 50.",
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
      "description": "Initial popup height in CSS pixels. Defaults to 300; resizing may override it.",
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
