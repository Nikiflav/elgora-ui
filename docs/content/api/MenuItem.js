export default {
  "name": "MenuItem",
  "kind": "interface",
  "type": "MenuItem",
  "description": "A declarative action, link, divider, or nested submenu entry.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Popup",
  "path": "/api-reference/MenuItem",
  "source": "src/components/popup/PopupMenu.ts",
  "members": [
    {
      "name": "key",
      "type": "string | number | undefined",
      "description": "Stable identity used by the VNode reconciler when menu items change.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/PopupMenu.ts",
      "kind": "property"
    },
    {
      "name": "text",
      "type": "string | undefined",
      "description": "Visible item label.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/PopupMenu.ts",
      "kind": "property"
    },
    {
      "name": "icon",
      "type": "RemixIcon | undefined",
      "description": "Remix Icon class name rendered before the label.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/PopupMenu.ts",
      "kind": "property"
    },
    {
      "name": "url",
      "type": "string | undefined",
      "description": "Destination URL for a leaf item.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/PopupMenu.ts",
      "kind": "property"
    },
    {
      "name": "urlTarget",
      "type": "string | undefined",
      "description": "Target browsing context used with `url`.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/PopupMenu.ts",
      "kind": "property"
    },
    {
      "name": "action",
      "type": "((event?: Event) => any) | undefined",
      "description": "Callback invoked when a leaf item is activated.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/PopupMenu.ts",
      "kind": "property"
    },
    {
      "name": "closeOnAction",
      "type": "boolean | undefined",
      "description": "Overrides the menu default for whether this item closes the menu after activation.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/PopupMenu.ts",
      "kind": "property"
    },
    {
      "name": "isDivider",
      "type": "boolean | undefined",
      "description": "Renders a non-interactive separator instead of an action item.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/PopupMenu.ts",
      "kind": "property"
    },
    {
      "name": "className",
      "type": "string | undefined",
      "description": "Custom CSS class names applied to the item container.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/PopupMenu.ts",
      "kind": "property"
    },
    {
      "name": "ui",
      "type": "import(\"D:/Dev/github/elgora-ui/src/index\").UiStyle | import(\"D:/Dev/github/elgora-ui/src/index\").UiStyle[] | undefined",
      "description": "Elgora UI utility styles applied to the item control.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/PopupMenu.ts",
      "kind": "property"
    },
    {
      "name": "showText",
      "type": "boolean | undefined",
      "description": "Whether to omit the visible label and render an icon-only item.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/PopupMenu.ts",
      "kind": "property"
    },
    {
      "name": "hint",
      "type": "string | undefined",
      "description": "Tooltip text and fallback accessible label.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/PopupMenu.ts",
      "kind": "property"
    },
    {
      "name": "ariaLabel",
      "type": "string | undefined",
      "description": "Explicit accessible label for icon-only items.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/PopupMenu.ts",
      "kind": "property"
    },
    {
      "name": "checked",
      "type": "(() => boolean) | undefined",
      "description": "Returns the current checked state for a menu item.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/PopupMenu.ts",
      "kind": "property"
    },
    {
      "name": "disabled",
      "type": "boolean | (() => boolean) | undefined",
      "description": "Whether the item is unavailable; may be evaluated dynamically.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/PopupMenu.ts",
      "kind": "property"
    },
    {
      "name": "subItems",
      "type": "(() => Promise<MenuItem[] | null>) | undefined",
      "description": "Asynchronously returns child entries rendered as a nested submenu, or `null` when there is no submenu.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/popup/PopupMenu.ts",
      "kind": "property"
    }
  ]
};
