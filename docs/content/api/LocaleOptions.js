export default {
  "name": "LocaleOptions",
  "kind": "interface",
  "type": "LocaleOptions",
  "description": "Common locale override and optional application-local context.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Types",
  "path": "/api-reference/LocaleOptions",
  "source": "src/localization/Localization.ts",
  "members": [
    {
      "name": "localization",
      "type": "Localization | undefined",
      "description": "Shared application context. Omission uses Localization.default; an explicit locale takes priority.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/localization/Localization.ts",
      "kind": "property"
    }
  ]
};
