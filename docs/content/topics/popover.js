export default {
  "id": "popover",
  "title": "Popover",
  "path": "/popover",
  "group": "components",
  "order": 20,
  "description": "Create anchored and point-positioned floating panels.",
  "toc": true,
  "api": [
    "Popover",
    "PopoverOptions",
    "PopoverPoint",
    "PopoverPlacement",
    "PopoverCloseMode"
  ],
  "keywords": [
    "popover",
    "anchor",
    "context menu",
    "floating panel"
  ],
  "html": "<h1>Popover</h1>\n<p><code>Popover</code> is a reusable floating panel. It can be positioned relative to an\nanchor element or at a screen point, making it useful for contextual help,\nmenus, inspectors, and custom context-menu interactions.</p>\n<h2>Anchored popover</h2>\n<p>Pass an <code>anchorElement</code> and a placement to position the panel relative to a\nnative element. The panel is a Component, so it can contain text, native\nelements, or other Components.</p>\n<div data-live-demo=\"popover-anchored\"></div>The essential API shape is:\n<pre><code class=\"language-js\">const popover = new Popover({\n  anchorElement: button,\n  placement: &quot;bottom-start&quot;,\n  children: &quot;Popover content&quot;\n});\n\npopover.mount(document.body);\npopover.show();\n</code></pre>\n<h2>Point-based popover</h2>\n<p>Use <code>setPoint(x, y)</code> and <code>show()</code> when the panel should open at a pointer\nposition, such as after a <code>contextmenu</code> event.</p>\n<pre><code class=\"language-js\">target.addEventListener(&quot;contextmenu&quot;, event =&gt; {\n  event.preventDefault();\n  popover.setPoint(event.clientX, event.clientY);\n  popover.show();\n});\n</code></pre>\n<p>See the <a href=\"?!=/api-reference/Popover\"><code>Popover</code> API reference</a>, including\n<a href=\"?!=/api-reference/PopoverOptions\"><code>PopoverOptions</code></a>,\n<a href=\"?!=/api-reference/PopoverPoint\"><code>PopoverPoint</code></a>,\n<a href=\"?!=/api-reference/PopoverPlacement\"><code>PopoverPlacement</code></a>, and\n<a href=\"?!=/api-reference/PopoverCloseMode\"><code>PopoverCloseMode</code></a>.</p>\n",
  "demos": [
    {
      "id": "popover-anchored",
      "module": "./content/components/popover.md.ts",
      "source": "const component = new Component({\n    ui: [\"elg\", \"d-flex\", \"flex-col\", \"gap-3\"],\n    comcreate(com) {\n        const anchor = cbutton({ ui: [\"elg\", \"btn\", \"primary\"] }, \"Open popover\");\n        const popover = new Popover({\n            anchorElement: anchor.dom,\n            bindAnchorTarget: false,\n            placement: \"bottom-start\",\n            children: e(\"span\", { ui: [\"elg\"] }, \"This panel is positioned relative to the button.\")\n        });\n        anchor.dom.addEventListener(\"click\", () => popover.toggle());\n        com.append([anchor, popover]);\n        const target = e(\"div\", { ui: [\"elg\", \"p-3\", \"border\", \"border-dashed\", \"rounded-1\", \"user-select-none\"] }, \"Right-click here for a point-based popover\");\n        const pointPopover = new Popover({\n            point: { x: 0, y: 0 },\n            placement: \"bottom-start\",\n            children: \"Context popover\"\n        });\n        target.addEventListener(\"contextmenu\", event => {\n            event.preventDefault();\n            pointPopover.setPoint(event.clientX, event.clientY);\n            pointPopover.show();\n        });\n        com.append([target, pointPopover]);\n    }\n});\ncomponent.mount(document.body);",
      "code": "const component = new Component({\n    ui: [\"elg\", \"d-flex\", \"flex-col\", \"gap-3\"],\n    comcreate(com) {\n        const anchor = cbutton({ ui: [\"elg\", \"btn\", \"primary\"] }, \"Open popover\");\n        const popover = new Popover({\n            anchorElement: anchor.dom,\n            bindAnchorTarget: false,\n            placement: \"bottom-start\",\n            children: e(\"span\", { ui: [\"elg\"] }, \"This panel is positioned relative to the button.\")\n        });\n        anchor.dom.addEventListener(\"click\", () => popover.toggle());\n        com.append([anchor, popover]);\n        const target = e(\"div\", { ui: [\"elg\", \"p-3\", \"border\", \"border-dashed\", \"rounded-1\", \"user-select-none\"] }, \"Right-click here for a point-based popover\");\n        const pointPopover = new Popover({\n            point: { x: 0, y: 0 },\n            placement: \"bottom-start\",\n            children: \"Context popover\"\n        });\n        target.addEventListener(\"contextmenu\", event => {\n            event.preventDefault();\n            pointPopover.setPoint(event.clientX, event.clientY);\n            pointPopover.show();\n        });\n        com.append([target, pointPopover]);\n    }\n});\ncomponent.mount(document.body);"
    }
  ]
};
