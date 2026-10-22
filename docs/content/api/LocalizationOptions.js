export default {
  "name": "LocalizationOptions",
  "kind": "interface",
  "type": "LocalizationOptions",
  "description": "Initial regional settings for an independent application context. Register optional dictionaries with addMessages.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Types",
  "path": "/api-reference/LocalizationOptions",
  "source": "src/localization/Localization.ts",
  "members": [
    {
      "name": "locale",
      "type": "string | undefined",
      "description": "BCP 47 locale, e.g. bg-BG or en-US. Omission uses the runtime locale.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/localization/Localization.ts",
      "kind": "property"
    }
  ]
};
