export default {
  "id": "popup-menu",
  "title": "PopupMenu",
  "path": "/popup",
  "group": "components",
  "order": 30,
  "description": "Build dynamic action menus with nested items and context positioning.",
  "toc": true,
  "api": [
    "PopupMenu",
    "PopupMenuOptions",
    "PopupMenuShowOptions",
    "MenuItem",
    "RemixIcon"
  ],
  "keywords": [
    "popup menu",
    "menu",
    "submenu",
    "context menu"
  ],
  "html": "<h1>PopupMenu</h1>\n<p><code>PopupMenu</code> renders action menus on demand. Items can contain icons, actions,\nlinks, dividers, checked state, and asynchronously loaded nested submenus.</p>\n<h2>Dynamic nested menu</h2>\n<p>Create a menu once and provide its items when the trigger is activated. This\nkeeps menu content close to the action that opens it and allows submenus to be\nloaded only when needed.</p>\n<div data-live-demo=\"popup-menu-dynamic\"></div>\n<h2>Context menu</h2>\n<p>The same menu can be opened at the pointer by passing a <code>point</code> to <code>show()</code>.</p>\n<pre><code class=\"language-js\">target.addEventListener(&quot;contextmenu&quot;, event =&gt; {\n  event.preventDefault();\n  menu.show({\n    point: { x: event.clientX, y: event.clientY },\n    items: createItems()\n  });\n});\n</code></pre>\n<p>See the <a href=\"?!=/api-reference/PopupMenu\"><code>PopupMenu</code> API reference</a>,\n<a href=\"?!=/api-reference/PopupMenuOptions\"><code>PopupMenuOptions</code></a>,\n<a href=\"?!=/api-reference/PopupMenuShowOptions\"><code>PopupMenuShowOptions</code></a>,\n<a href=\"?!=/api-reference/MenuItem\"><code>MenuItem</code></a>, and\n<a href=\"?!=/api-reference/RemixIcon\"><code>RemixIcon</code></a>.</p>\n",
  "demos": [
    {
      "id": "popup-menu-dynamic",
      "source": "const component = new Component({\n    ui: [\"elg\", \"d-flex\", \"flex-col\", \"gap-3\"],\n    comcreate(com) {\n        const anchor = cbutton({ ui: [\"elg\", \"btn\", \"primary\"] }, \"Open menu\");\n        const menu = new PopupMenu();\n        const items = [\n            { key: \"edit\", text: \"Edit\", icon: \"ri-edit-line\", action: () => alert(\"Edit selected\") },\n            {\n                key: \"share\",\n                text: \"Share\",\n                icon: \"ri-share-line\",\n                subItems: async () => [{ key: \"copy\", text: \"Copy link\", icon: \"ri-link\", action: () => alert(\"Link copied\") }]\n            },\n            { isDivider: true },\n            { key: \"delete\", text: \"Delete\", icon: \"ri-delete-bin-line\", action: () => alert(\"Delete selected\") }\n        ];\n        anchor.dom.addEventListener(\"click\", () => menu.toggle({ anchor: anchor.dom, items }));\n        com.append([anchor, menu]);\n        const target = e(\"div\", { ui: [\"elg\", \"p-3\", \"border\", \"border-dashed\", \"rounded-1\", \"user-select-none\"] }, \"Right-click for context actions\");\n        const contextMenu = new PopupMenu();\n        target.addEventListener(\"contextmenu\", event => {\n            event.preventDefault();\n            contextMenu.show({\n                point: { x: event.clientX, y: event.clientY },\n                items: [{ text: \"Refresh\", icon: \"ri-refresh-line\", action: () => alert(\"Refresh selected\") }]\n            });\n        });\n        com.append([target, contextMenu]);\n    }\n});\ncomponent.mount(document.body);",
      "code": "with (Elgora) {\nfunction createDemo() {\n    const component = new Component({\n        ui: [\"elg\", \"d-flex\", \"flex-col\", \"gap-3\"],\n        comcreate(com) {\n            const anchor = cbutton({ ui: [\"elg\", \"btn\", \"primary\"] }, \"Open menu\");\n            const menu = new PopupMenu();\n            const items = [\n                { key: \"edit\", text: \"Edit\", icon: \"ri-edit-line\", action: () => alert(\"Edit selected\") },\n                {\n                    key: \"share\",\n                    text: \"Share\",\n                    icon: \"ri-share-line\",\n                    subItems: async () => [{ key: \"copy\", text: \"Copy link\", icon: \"ri-link\", action: () => alert(\"Link copied\") }]\n                },\n                { isDivider: true },\n                { key: \"delete\", text: \"Delete\", icon: \"ri-delete-bin-line\", action: () => alert(\"Delete selected\") }\n            ];\n            anchor.dom.addEventListener(\"click\", () => menu.toggle({ anchor: anchor.dom, items }));\n            com.append([anchor, menu]);\n            const target = e(\"div\", { ui: [\"elg\", \"p-3\", \"border\", \"border-dashed\", \"rounded-1\", \"user-select-none\"] }, \"Right-click for context actions\");\n            const contextMenu = new PopupMenu();\n            target.addEventListener(\"contextmenu\", event => {\n                event.preventDefault();\n                contextMenu.show({\n                    point: { x: event.clientX, y: event.clientY },\n                    items: [{ text: \"Refresh\", icon: \"ri-refresh-line\", action: () => alert(\"Refresh selected\") }]\n                });\n            });\n            com.append([target, contextMenu]);\n        }\n    });\n    component.mount(document.body);\n}\ncreateDemo();\n}"
    }
  ]
};
