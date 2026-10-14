export default {
  "name": "PopoverEditorOptions",
  "kind": "interface",
  "type": "PopoverEditorOptions",
  "description": "Shared behavior for value editors with a picker popover.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/PopoverEditorOptions",
  "source": "src/components/editors/PopoverEditorOptions.ts",
  "members": [
    {
      "name": "openOnFocus",
      "type": "boolean | undefined",
      "description": "Opens the picker when the input receives focus. DateEditor focuses Calendar;\nLookupEditor keeps focus in its search input.\nDefaults to false. Explicit button/keyboard opening remains available.",
      "tags": [
        {
          "name": "example",
          "text": "new DateEditor({ value: null, openOnFocus: true });"
        }
      ],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/PopoverEditorOptions.ts",
      "kind": "property"
    }
  ]
};
