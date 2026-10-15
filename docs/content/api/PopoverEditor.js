export default {
  "name": "PopoverEditor",
  "kind": "class",
  "type": "PopoverEditor<T>",
  "description": "Text editor with a lazily created picker. Closing changes visibility only;\nparsing, validation and acceptance remain independent editor operations.\nSubclasses provide picker content, preparation and the initial focus target.",
  "tags": [
    {
      "name": "example",
      "text": "class ColorEditor extends PopoverEditor<string> {\n    protected createPopup(): Popover {\n        return new Popover({ anchorElement: this.control, bindAnchorTarget: false,\n            closeMode: \"manual\", children: e(\"button\", {\n                onclick: () => this.acceptPickerText(\"blue\")\n            }, \"Blue\") });\n    }\n}\nconst editor = new ColorEditor({ value: \"red\", triggerIcon: \"ri-palette-line\", triggerLabel: \"Choose color\" });"
    }
  ],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/PopoverEditor",
  "source": "src/components/editors/PopoverEditor.ts",
  "members": [
    {
      "name": "isOpen",
      "type": "boolean",
      "description": "Whether the picker is currently visible, independent of commit state.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/PopoverEditor.ts",
      "kind": "property"
    },
    {
      "name": "open",
      "type": "() => Promise<void>",
      "description": "Opens explicitly without accepting or saving the draft.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/PopoverEditor.ts",
      "parameters": [],
      "returns": {
        "type": "Promise<void>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => Promise<void>"
    },
    {
      "name": "close",
      "type": "() => void",
      "description": "Hides without accepting or discarding text. Invalidates any pending opening request.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/PopoverEditor.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "setValue",
      "type": "(value: T) => void",
      "description": "Loading a value invalidates a picker opening based on an older draft.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/PopoverEditor.ts",
      "parameters": [
        {
          "name": "value",
          "type": "T",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(value: T) => void"
    },
    {
      "name": "cancel",
      "type": "() => boolean",
      "description": "Escape restores accepted text and closes; close() alone never cancels an edit.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/PopoverEditor.ts",
      "parameters": [],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "() => boolean"
    }
  ]
};
