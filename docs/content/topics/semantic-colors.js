export default {
  "id": "semantic-colors",
  "title": "Semantic colors",
  "path": "/styles/semantic-colors",
  "group": "styles",
  "order": 10,
  "description": "Understand ElgoraUI semantic color roles and their background, text, and border tokens.",
  "toc": true,
  "api": [],
  "keywords": [
    "colors",
    "theme",
    "semantic",
    "tokens",
    "light",
    "dark"
  ],
  "html": "<h1>Semantic colors</h1>\n<p>ElgoraUI uses semantic colors instead of hard-coded color names. The same <code>primary</code> or <code>danger</code> role adapts to the active theme, while the markup stays unchanged.</p>\n<h2>Color roles</h2>\n<p>The built-in roles are <code>primary</code>, <code>accent</code>, <code>neutral</code>, <code>success</code>, <code>warning</code>, and <code>danger</code>. Every role defines three related tokens:</p>\n<table>\n<thead>\n<tr>\n<th>Token</th>\n<th>Purpose</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td><code>--elg-&lt;role&gt;-bg</code></td>\n<td>Background or fill of the semantic element</td>\n</tr>\n<tr>\n<td><code>--elg-&lt;role&gt;-text</code></td>\n<td>Text and icon color on that background</td>\n</tr>\n<tr>\n<td><code>--elg-&lt;role&gt;-border</code></td>\n<td>Border, divider, or outline color</td>\n</tr>\n</tbody>\n</table>\n<p>The matching utility class applies the background, foreground text, and border roles together. For example, <code>ui: [&quot;elg&quot;, &quot;success&quot;]</code> is a complete success surface; use <code>success-bg</code>, <code>success-text</code>, or <code>success-border</code> when only one role is needed.</p>\n<div data-live-demo=\"semantic-color-swatches\"></div>## Theme-aware components\n<p>Use semantic classes for controls and containers so a theme switch changes the entire example consistently. The tokens are also available as CSS variables when a component needs a custom rule.</p>\n<div data-live-demo=\"semantic-theme-preview\"></div>Use `*-bg` for a fill, `*-text` for text or icons, and `*-border` for outlines. Prefer the complete semantic class when the three roles belong together; this keeps the result readable in both light and dark themes.\n<p>Continue with <a href=\"?!=/styles/html-elements\">HTML elements</a> to see these roles applied to native elements and controls.</p>\n",
  "demos": [
    {
      "id": "semantic-color-swatches",
      "module": "./content/styles/semantic-colors.md.swatches.ts",
      "source": "const colors = [\"primary\", \"accent\", \"neutral\", \"success\", \"warning\", \"danger\"];\nconst content = e(\"div\", { ui: [\"elg\", \"d-flex\", \"flex-wrap\", \"gap-2\"] }, ...colors.map(color => e(\"div\", {\n    ui: [\"elg\", color, \"p-3\", \"rounded-1\"],\n    style: { minWidth: \"120px\" }\n}, color)));\ndocument.body.append(content);",
      "code": "const colors = [\"primary\", \"accent\", \"neutral\", \"success\", \"warning\", \"danger\"];\nconst content = e(\"div\", { ui: [\"elg\", \"d-flex\", \"flex-wrap\", \"gap-2\"] }, ...colors.map(color => e(\"div\", {\n    ui: [\"elg\", color, \"p-3\", \"rounded-1\"],\n    style: { minWidth: \"120px\" }\n}, color)));\ndocument.body.append(content);",
      "mode": "readonly"
    },
    {
      "id": "semantic-theme-preview",
      "module": "./content/styles/semantic-colors.md.theme-preview.ts",
      "source": "const component = new Component({\n    ui: [\"elg\", \"d-flex\", \"flex-col\", \"gap-2\", \"p-3\", \"surface-2\", \"rounded-1\"],\n    comcreate(com) {\n        const themes = [\"light\", \"dark\"];\n        const themeColors = [\"primary\", \"success\", \"warning\", \"danger\"];\n        const currentTheme = com.observable(document.documentElement.dataset.theme || \"light\");\n        com.state = { currentTheme };\n        com.append([\n            e(\"label\", { ui: [\"elg\", \"d-flex\", \"flex-col\", \"gap-1\"] }, \"Preview theme\", e(\"select\", {\n                ui: [\"elg\", \"field\"],\n                value: currentTheme.Value,\n                onchange: event => {\n                    currentTheme.Value = event.target.value;\n                }\n            }, ...themes.map(theme => e(\"option\", { value: theme }, theme)))),\n            e(\"div\", { ui: [\"elg\", \"d-flex\", \"gap-2\", \"flex-wrap\"] }, ...themeColors.map(color => e(\"div\", { ui: [\"elg\", color, \"p-2\", \"rounded-1\"] }, color)))\n        ]);\n        com.renderOnChange(currentTheme, () => {\n            document.documentElement.dataset.theme = currentTheme.Value;\n        });\n    },\n    comdispose() {\n        delete document.documentElement.dataset.theme;\n    }\n});\ncomponent.mount(document.body);",
      "code": "const component = new Component({\n    ui: [\"elg\", \"d-flex\", \"flex-col\", \"gap-2\", \"p-3\", \"surface-2\", \"rounded-1\"],\n    comcreate(com) {\n        const themes = [\"light\", \"dark\"];\n        const themeColors = [\"primary\", \"success\", \"warning\", \"danger\"];\n        const currentTheme = com.observable(document.documentElement.dataset.theme || \"light\");\n        com.state = { currentTheme };\n        com.append([\n            e(\"label\", { ui: [\"elg\", \"d-flex\", \"flex-col\", \"gap-1\"] }, \"Preview theme\", e(\"select\", {\n                ui: [\"elg\", \"field\"],\n                value: currentTheme.Value,\n                onchange: event => {\n                    currentTheme.Value = event.target.value;\n                }\n            }, ...themes.map(theme => e(\"option\", { value: theme }, theme)))),\n            e(\"div\", { ui: [\"elg\", \"d-flex\", \"gap-2\", \"flex-wrap\"] }, ...themeColors.map(color => e(\"div\", { ui: [\"elg\", color, \"p-2\", \"rounded-1\"] }, color)))\n        ]);\n        com.renderOnChange(currentTheme, () => {\n            document.documentElement.dataset.theme = currentTheme.Value;\n        });\n    },\n    comdispose() {\n        delete document.documentElement.dataset.theme;\n    }\n});\ncomponent.mount(document.body);",
      "mode": "readonly"
    }
  ]
};
