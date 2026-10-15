export default {
  "name": "Scrollbars",
  "kind": "class",
  "type": "Scrollbars",
  "description": "Adds custom scrollbars to native scroll containers or an entire document.\nWheel, touch, keyboard navigation and scrollIntoView remain browser-managed.",
  "tags": [
    {
      "name": "example",
      "text": "const handle = Scrollbars.attach(panel, { scrollbarMode: \"thin\" });"
    },
    {
      "name": "example",
      "text": "const installation = Scrollbars.install(window); // installation.dispose() restores native scrollbars."
    }
  ],
  "topics": [],
  "group": "components",
  "namespace": "Components.Scrollbar",
  "path": "/api-reference/Scrollbars",
  "source": "src/components/scrollbar/Scrollbars.ts",
  "members": [
    {
      "name": "attach",
      "type": "(target: HTMLElement | Window, options?: ScrollbarsOptions) => ScrollbarsHandle",
      "description": "Attaches once to an existing scroll container, textarea or Window.\nRepeated calls return the same handle; options update its presentation.\nAn automatic attachment becomes explicitly owned, so installations cannot change or dispose it.\nThe element's overflow, children and inline styles are preserved.",
      "tags": [
        {
          "name": "example",
          "text": "const handle = Scrollbars.attach(window); handle.scrollbarMode = \"always\";"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/Scrollbars.ts",
      "parameters": [
        {
          "name": "target",
          "type": "HTMLElement | Window",
          "optional": false,
          "description": ""
        },
        {
          "name": "options",
          "type": "ScrollbarsOptions",
          "optional": true,
          "defaultValue": "{}",
          "description": ""
        }
      ],
      "returns": {
        "type": "ScrollbarsHandle",
        "description": ""
      },
      "kind": "method",
      "signature": "(target: HTMLElement | Window, options?: ScrollbarsOptions) => ScrollbarsHandle"
    },
    {
      "name": "install",
      "type": "(target: HTMLElement | Window, options?: ScrollbarsOptions) => ScrollbarsInstallation",
      "description": "Enhances a container and its descendants, or the native scroll viewports in one Window.\nObserves DOM and layout changes, skipping ScrollEngine-owned subtrees.\nThe closest container installation wins; explicit attach() calls have highest priority.\nDisposing a local installation returns its viewports to a surrounding installation.\nIframes and shadow roots are not traversed. Dispose before releasing the application.",
      "tags": [
        {
          "name": "example",
          "text": "const installation = Scrollbars.install(window, { scrollbarMode: \"thin\" });"
        },
        {
          "name": "example",
          "text": "const dialogScrollbars = Scrollbars.install(dialog, { scrollbarMode: \"always\" });"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/scrollbar/Scrollbars.ts",
      "parameters": [
        {
          "name": "target",
          "type": "HTMLElement | Window",
          "optional": false,
          "description": ""
        },
        {
          "name": "options",
          "type": "ScrollbarsOptions",
          "optional": true,
          "defaultValue": "{}",
          "description": ""
        }
      ],
      "returns": {
        "type": "ScrollbarsInstallation",
        "description": ""
      },
      "kind": "method",
      "signature": "(target: HTMLElement | Window, options?: ScrollbarsOptions) => ScrollbarsInstallation"
    }
  ]
};
