export default {
  "name": "BrowserRouter",
  "kind": "class",
  "type": "BrowserRouter",
  "description": "A simple client-side router that uses the browser's history API to manage navigation without hard page reloads. It listens for URL changes and updates the displayed page accordingly based on a set of defined routes.\r\nThe url path is stored as url parameter named '!'. Example ?!=/home/sub1/sub2\r\nUrl parameter is used instead of hash to allow better support for server-side redirects.\r\nThe router also supports dynamic route parameters and provides a default 404 page if no matching route is found. It also handles navigation through anchor tags and the browser's back/forward buttons.\r\nTo use the router, create an instance of `BrowserRouter` with an array of route handlers and optionally a custom 404 page. Each route handler defines a URL pattern and a function to create the corresponding page component. The router will automatically manage the displayed content based on the current URL.\r\nOnly one instance of `BrowserRouter` should be created in the application, and it should be mounted to a container element where the page content will be displayed.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Browser Router",
  "path": "/api-reference/BrowserRouter",
  "source": "src/components/browser-router/BrowserRouter.ts",
  "members": [
    {
      "name": "routes",
      "type": "RouterHandler[]",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/browser-router/BrowserRouter.ts",
      "kind": "property"
    },
    {
      "name": "page404",
      "type": "RouterPage",
      "description": "The currently active page",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/browser-router/BrowserRouter.ts",
      "kind": "property"
    },
    {
      "name": "lastUrl",
      "type": "string | undefined",
      "description": "The last handled URL",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/browser-router/BrowserRouter.ts",
      "kind": "property"
    },
    {
      "name": "currentPage",
      "type": "RouterPage | undefined",
      "description": "Gets or sets the current page. Setting a new page will replace the content of the router container with the new page's DOM element.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/browser-router/BrowserRouter.ts",
      "kind": "property"
    },
    {
      "name": "currentPage",
      "type": "RouterPage | undefined",
      "description": "Gets or sets the current page. Setting a new page will replace the content of the router container with the new page's DOM element.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/browser-router/BrowserRouter.ts",
      "kind": "property"
    },
    {
      "name": "currentRoute",
      "type": "RouterHandler | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/browser-router/BrowserRouter.ts",
      "kind": "property"
    },
    {
      "name": "navigate",
      "type": "(url: string, replaceHistory?: boolean) => void",
      "description": "Navigates the browser to the specified url without a hard reload.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/browser-router/BrowserRouter.ts",
      "parameters": [
        {
          "name": "url",
          "type": "string",
          "optional": false,
          "description": ""
        },
        {
          "name": "replaceHistory",
          "type": "boolean",
          "optional": true,
          "defaultValue": "false",
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(url: string, replaceHistory?: boolean) => void"
    },
    {
      "name": "dispose",
      "type": "() => void",
      "description": "Removes global navigation listeners and releases the one-router-per-window\nslot. The router cannot be reused after disposal.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/browser-router/BrowserRouter.ts",
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
