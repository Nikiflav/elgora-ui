export default {
  "name": "LookupResult",
  "kind": "interface",
  "type": "LookupResult<TItem>",
  "description": "A page and the accurate count of all matches, not just this page.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/LookupResult",
  "source": "src/components/editors/LookupEditor.ts",
  "members": [
    {
      "name": "items",
      "type": "TItem[]",
      "description": "Matching items for the requested skip/top page, retaining their application-defined shape.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/LookupEditor.ts",
      "kind": "property"
    },
    {
      "name": "totalCount",
      "type": "number",
      "description": "Accurate number of matches before paging, used by the virtual result grid.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/LookupEditor.ts",
      "kind": "property"
    }
  ]
};
