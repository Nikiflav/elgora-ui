export default {
  "id": "browser-router",
  "title": "Browser Router",
  "path": "/components/browser-router",
  "group": "components",
  "order": 50,
  "description": "Navigate between client-side pages without full document reloads.",
  "toc": true,
  "api": [
    "BrowserRouter"
  ],
  "keywords": [
    "browser router",
    "routing",
    "navigation",
    "history api"
  ],
  "html": "<h1>Browser Router</h1>\n<p><code>BrowserRouter</code> maps the current browser URL to a page and replaces only the\nrouter’s content when navigation occurs. It uses the History API, handles\ninternal links, and responds to browser back and forward actions.</p>\n<h2>Define routes and mount the router</h2>\n<p>A route handler provides a path and a page factory. A page contains its DOM\nroot and can optionally provide a title, description, and initialization hook.</p>\n<div data-live-demo=\"browser-router-basic\"></div>The router should normally be created once for the application and mounted to\nthe element that owns the page content.\n<p>See the <a href=\"?!=/api-reference/BrowserRouter\"><code>BrowserRouter</code> API reference</a>.</p>\n",
  "demos": [
    {
      "id": "browser-router-basic",
      "source": "const page = (title, message) => ({\n    title,\n    description: message,\n    dom: e(\"section\", {\n        ui: [\"elg\", \"p-3\"]\n    }, e(\"h2\", title), e(\"p\", message))\n});\nconst router = new BrowserRouter([\n    {\n        path: \"/\",\n        createPage: () => page(\"Home\", \"This is the home page.\")\n    },\n    {\n        path: \"/details\",\n        createPage: () => page(\"Details\", \"This page was rendered by the router.\")\n    }\n]);\nconst navigation = e(\"nav\", {\n    ui: [\"elg\", \"d-flex\", \"gap-2\", \"p-2\", \"border-bottom\"]\n}, e(\"a\", { href: \"?!=/\", ui: [\"elg\", \"no-underline\"] }, \"Home\"), e(\"a\", { href: \"?!=/details\", ui: [\"elg\", \"no-underline\"] }, \"Details\"));\ndocument.body.append(navigation, router.dom);",
      "code": "with (Elgora) {\nfunction createDemo() {\n    const page = (title, message) => ({\n        title,\n        description: message,\n        dom: e(\"section\", {\n            ui: [\"elg\", \"p-3\"]\n        }, e(\"h2\", title), e(\"p\", message))\n    });\n    const router = new BrowserRouter([\n        {\n            path: \"/\",\n            createPage: () => page(\"Home\", \"This is the home page.\")\n        },\n        {\n            path: \"/details\",\n            createPage: () => page(\"Details\", \"This page was rendered by the router.\")\n        }\n    ]);\n    const navigation = e(\"nav\", {\n        ui: [\"elg\", \"d-flex\", \"gap-2\", \"p-2\", \"border-bottom\"]\n    }, e(\"a\", { href: \"?!=/\", ui: [\"elg\", \"no-underline\"] }, \"Home\"), e(\"a\", { href: \"?!=/details\", ui: [\"elg\", \"no-underline\"] }, \"Details\"));\n    document.body.append(navigation, router.dom);\n}\ncreateDemo();\n}",
      "height": "240px"
    }
  ]
};
