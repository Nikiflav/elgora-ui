export default {
  "name": "ScrollSpy",
  "kind": "class",
  "type": "ScrollSpy",
  "description": "Nonvisual, frame-batched scroll tracking for existing HTML navigation.\nDoes not intercept clicks or change the URL. Call refresh() after replacing\nheadings or links, and dispose() when the owning view is removed.",
  "tags": [
    {
      "name": "example",
      "text": "const spy = new ScrollSpy({ container: article, navigation: toc });"
    }
  ],
  "topics": [],
  "group": "components",
  "namespace": "Components.Scroll Spy",
  "path": "/api-reference/ScrollSpy",
  "source": "src/components/scroll-spy/ScrollSpy.ts",
  "members": [
    {
      "name": "refresh",
      "type": "() => void",
      "description": "Rescans links and schedules measurement; safe to call before mounting.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scroll-spy/ScrollSpy.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "dispose",
      "type": "() => void",
      "description": "Releases listeners and restores the navigation's original attributes.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/scroll-spy/ScrollSpy.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    }
  ]
};
