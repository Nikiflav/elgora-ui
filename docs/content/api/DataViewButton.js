export default {
  "name": "DataViewButton",
  "kind": "interface",
  "type": "DataViewButton<TRow>",
  "description": "A semantic action rendered by a `type: \"buttons\"` field.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/DataViewButton",
  "source": "src/data/DataViewField.ts",
  "members": [
    {
      "name": "id",
      "type": "string",
      "description": "Stable action identifier, also used as the VNode key.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "text",
      "type": "string | undefined",
      "description": "Optional visible label.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "icon",
      "type": "string | undefined",
      "description": "Optional Remix Icon class, e.g. `ri-edit-line`.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "description",
      "type": "string | undefined",
      "description": "Optional longer explanation used to build the fallback icon-only tooltip.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "tooltip",
      "type": "string | undefined",
      "description": "Optional tooltip and accessible label. Falls back to `text`, `description`, then `id`.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "appearance",
      "type": "DataViewButtonAppearance | undefined",
      "description": "Controls whether the action shows its icon, text, or both. Defaults to the available content.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "ui",
      "type": "UiStyle | UiStyle[] | undefined",
      "description": "Optional typed UI styles; when omitted, action buttons use the `neutral` variant.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "visible",
      "type": "boolean | ((context: DataViewButtonContext<TRow>) => boolean) | undefined",
      "description": "Controls whether the button is rendered for this row.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "disabled",
      "type": "boolean | ((context: DataViewButtonContext<TRow>) => boolean) | undefined",
      "description": "Prevents invocation while retaining the button in the layout.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "pressed",
      "type": "boolean | \"mixed\" | ((context: DataViewButtonContext<TRow>) => boolean | \"mixed\") | undefined",
      "description": "Optional toggle state exposed through `aria-pressed`.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "onClick",
      "type": "((context: DataViewButtonContext<TRow>) => void | Promise<void>) | undefined",
      "description": "Invoked after the host has stopped the event from changing grid/form selection.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "render",
      "type": "((context: DataViewButtonContext<TRow>) => VNode<any>) | undefined",
      "description": "Replaces the standard icon/text content while the host still owns the button element.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    }
  ]
};
