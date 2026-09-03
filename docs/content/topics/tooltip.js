export default {
  "id": "tooltip",
  "title": "Tooltip",
  "path": "/tooltip",
  "group": "components",
  "order": 40,
  "description": "Add hover and keyboard-focus descriptions to any element.",
  "toc": true,
  "api": [
    "Tooltip",
    "TooltipContent",
    "TooltipShowOptions"
  ],
  "keywords": [
    "tooltip",
    "hover",
    "focus",
    "accessibility"
  ],
  "html": "<h1>Tooltip</h1>\n<p><code>Tooltip.attach()</code> adds a small description to an anchor. It supports pointer\nhover and keyboard focus, accepts plain text or rich content, and returns a\ncleanup function for temporary UI.</p>\n<h2>Attach a tooltip</h2>\n<p>Attach a tooltip to any suitable native element or Component DOM root. The\nplacement and delay are optional.</p>\n<div data-live-demo=\"tooltip-attach\"></div>\n<h2>Rich content</h2>\n<p>Tooltip content can be a string, an <code>HTMLElement</code>, a Component, or another\nsupported typed content value.</p>\n<pre><code class=\"language-js\">const content = e(&quot;span&quot;, { ui: [&quot;elg&quot;] }, &quot;Rich tooltip&quot;);\n\nTooltip.attach(anchor, content, { placement: &quot;right&quot; });\n</code></pre>\n<p>Call the returned cleanup function when the anchor is removed or the tooltip\nis no longer needed.</p>\n<p>See the <a href=\"?!=/api-reference/Tooltip\"><code>Tooltip</code> API reference</a>,\n<a href=\"?!=/api-reference/TooltipContent\"><code>TooltipContent</code></a>, and\n<a href=\"?!=/api-reference/TooltipShowOptions\"><code>TooltipShowOptions</code></a>.</p>\n",
  "demos": [
    {
      "id": "tooltip-attach",
      "module": "./content/components/tooltip.md.ts",
      "source": "const component = new Component({\n    ui: [\"elg\", \"d-flex\", \"flex-col\", \"gap-3\"],\n    comcreate(com) {\n        const button = cbutton({ ui: [\"elg\", \"btn\", \"primary\"] }, \"Hover or focus me\");\n        Tooltip.attach(button.dom, \"Helpful description\", { placement: \"top\", delay: 300 });\n        com.append(button);\n        const richButton = cbutton({ ui: [\"elg\", \"btn\", \"accent\"] }, \"Show rich tooltip\");\n        const content = e(\"span\", { ui: [\"elg\", \"d-flex\", \"flex-col\", \"gap-1\"] }, e(\"strong\", { ui: [\"elg\"] }, \"Rich tooltip\"), e(\"span\", { ui: [\"elg\"] }, \"Tooltip content can be an HTMLElement.\"));\n        Tooltip.attach(richButton.dom, content, { placement: \"right\" });\n        com.append(richButton);\n    }\n});\ncomponent.mount(document.body);",
      "code": "const component = new Component({\n    ui: [\"elg\", \"d-flex\", \"flex-col\", \"gap-3\"],\n    comcreate(com) {\n        const button = cbutton({ ui: [\"elg\", \"btn\", \"primary\"] }, \"Hover or focus me\");\n        Tooltip.attach(button.dom, \"Helpful description\", { placement: \"top\", delay: 300 });\n        com.append(button);\n        const richButton = cbutton({ ui: [\"elg\", \"btn\", \"accent\"] }, \"Show rich tooltip\");\n        const content = e(\"span\", { ui: [\"elg\", \"d-flex\", \"flex-col\", \"gap-1\"] }, e(\"strong\", { ui: [\"elg\"] }, \"Rich tooltip\"), e(\"span\", { ui: [\"elg\"] }, \"Tooltip content can be an HTMLElement.\"));\n        Tooltip.attach(richButton.dom, content, { placement: \"right\" });\n        com.append(richButton);\n    }\n});\ncomponent.mount(document.body);"
    }
  ]
};
