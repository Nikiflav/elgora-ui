export default {
  "name": "RenderRowArgs",
  "kind": "type",
  "type": "any",
  "description": "Interface for rendering a row in the virtual list.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Virtual List",
  "path": "/api-reference/RenderRowArgs",
  "source": "src/components/virtual-list/VirtualList.ts",
  "definition": "{\r\n    /** The row html element. Users should add content to this element. */\r\n    rowElement: HTMLElement\r\n\r\n    /** The current width of the virtual list container. */\r\n    readonly viewportWidth: number\r\n    /** The current left scroll position of the virtual list container. May be used to implment horizontal virtual scrolling. */\r\n    readonly scrollLeft: number\r\n    /** The row data */\r\n    readonly data: T\r\n    /** The row visible index. */\r\n    readonly index: number\r\n}"
};
