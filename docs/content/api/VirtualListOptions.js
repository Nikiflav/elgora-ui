export default {
  "name": "VirtualListOptions",
  "kind": "interface",
  "type": "VirtualListOptions<T>",
  "description": "Construction options for a virtualized list component.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Virtual List",
  "path": "/api-reference/VirtualListOptions",
  "source": "src/components/virtual-list/VirtualList.ts",
  "members": [
    {
      "name": "data",
      "type": "VirtualDataSource<T>",
      "description": "A virtual list data source. The data items are rendered as rows in the list.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/virtual-list/VirtualList.ts",
      "kind": "property"
    },
    {
      "name": "renderRow",
      "type": "(args: RenderRowArgs<T>) => void",
      "description": "A function that renders a row in the virtual list. The user must append content to the row element.",
      "tags": [
        {
          "name": "param",
          "text": "args"
        },
        {
          "name": "returns",
          "text": ""
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/virtual-list/VirtualList.ts",
      "kind": "property"
    },
    {
      "name": "contentElement",
      "type": "HTMLElement | undefined",
      "description": "Custom conent element for the virtual list. If not provided, a default DIV element will be used.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/virtual-list/VirtualList.ts",
      "kind": "property"
    },
    {
      "name": "transformContentElement",
      "type": "HTMLElement | undefined",
      "description": "The element that contains the displayed rows and it's position is transformed by the virtual list component.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/virtual-list/VirtualList.ts",
      "kind": "property"
    },
    {
      "name": "createRowElement",
      "type": "((content: HTMLElement) => HTMLElement) | undefined",
      "description": "A function that creates a row element for the virtual list.\r\nThe element must be appended to the content element before being returned.",
      "tags": [
        {
          "name": "param",
          "text": "content The content element of the virtual list."
        },
        {
          "name": "returns",
          "text": "The row element."
        }
      ],
      "topics": [],
      "optional": true,
      "source": "src/components/virtual-list/VirtualList.ts",
      "kind": "property"
    },
    {
      "name": "beforeRender",
      "type": "(() => void) | undefined",
      "description": "A function that is called before the virtual list is rendered. The content element is available at this point and all size and scroll offset properties are also available.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/virtual-list/VirtualList.ts",
      "kind": "property"
    },
    {
      "name": "afterRender",
      "type": "(() => void) | undefined",
      "description": "A function that is called after the virtual list is rendered. Can be used to measure DOM elements.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/virtual-list/VirtualList.ts",
      "kind": "property"
    }
  ]
};
