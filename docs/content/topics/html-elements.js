export default {
  "id": "html-elements",
  "title": "HTML elements",
  "path": "/styles/html-elements",
  "group": "styles",
  "order": 20,
  "description": "Explore how ElgoraUI styles native HTML elements, controls, containers, and tables.",
  "toc": true,
  "api": [],
  "keywords": [
    "html",
    "elements",
    "buttons",
    "forms",
    "tables",
    "surfaces"
  ],
  "html": "<h1>HTML elements</h1>\n<p>ElgoraUI styles native HTML elements through the <code>elg</code> marker and the <code>ui</code> array. The same <code>e()</code> composition API works for a one-off element, while <code>cbutton()</code> and other components add reusable behavior.</p>\n<h2>Containers and surfaces</h2>\n<p>Use <code>surface</code>, <code>surface-2</code>, and <code>surface-3</code> to establish visual layers. Add <code>box</code> when a surface needs a border, radius, and spacing as a distinct content container.</p>\n<div data-live-demo=\"html-surfaces\"></div>## Buttons\n<p><code>button.elg</code> keeps the native element predictable and flat. Add <code>btn</code> for the component styling, then choose a semantic role such as <code>primary</code>, <code>neutral</code>, or <code>danger</code>.</p>\n<div data-live-demo=\"html-buttons\"></div>## Form controls\n<p>Add <code>field</code> when a native input, select, or textarea should participate in a form layout. The <code>elg</code> marker enables the framework defaults without affecting unmarked controls.</p>\n<div data-live-demo=\"html-form-controls\"></div>## Tables\n<p>Use <code>table</code> for the base table treatment. <code>table-row-borders</code> adds only horizontal separators, while <code>table-bordered</code> adds a border around the table and its cells.</p>\n<div data-live-demo=\"html-tables\"></div>To show cell boundaries as well, replace `table-row-borders` with `table-bordered`.\n<h2>Composition</h2>\n<p>Elements can be nested directly. Components are useful when behavior is reused, while <code>e()</code> is ideal for local structure:</p>\n<pre><code class=\"language-js\">root.append(\n    e(&quot;div&quot;, { ui: [&quot;elg&quot;, &quot;box&quot;, &quot;surface-2&quot;, &quot;p-3&quot;, &quot;d-flex&quot;, &quot;flex-col&quot;, &quot;gap-2&quot;] },\n        e(&quot;h3&quot;, {}, &quot;Account&quot;),\n        e(&quot;input&quot;, { ui: [&quot;elg&quot;, &quot;field&quot;], placeholder: &quot;Name&quot; }),\n        cbutton({ ui: [&quot;elg&quot;, &quot;btn&quot;, &quot;primary&quot;], children: &quot;Save&quot; })\n    )\n);\n</code></pre>\n",
  "demos": [
    {
      "id": "html-surfaces",
      "module": "./content/styles/html-elements.md.surfaces.ts",
      "source": "const surfaceNames = [\"surface\", \"surface-2\", \"surface-3\"];\nconst content = e(\"div\", { ui: [\"elg\", \"d-flex\", \"flex-col\", \"gap-2\"] }, ...surfaceNames.map((surface, index) => e(\"div\", {\n    ui: [\"elg\", surface, \"box\", \"p-3\"]\n}, surface + \" layer\", e(\"p\", { ui: [\"elg\", \"text-muted\", \"m-0\"] }, \"Content on \" + (index === 0 ? \"the page\" : \"a raised layer\") + \".\"))));\ndocument.body.append(content);",
      "code": "const surfaceNames = [\"surface\", \"surface-2\", \"surface-3\"];\nconst content = e(\"div\", { ui: [\"elg\", \"d-flex\", \"flex-col\", \"gap-2\"] }, ...surfaceNames.map((surface, index) => e(\"div\", {\n    ui: [\"elg\", surface, \"box\", \"p-3\"]\n}, surface + \" layer\", e(\"p\", { ui: [\"elg\", \"text-muted\", \"m-0\"] }, \"Content on \" + (index === 0 ? \"the page\" : \"a raised layer\") + \".\"))));\ndocument.body.append(content);",
      "mode": "readonly"
    },
    {
      "id": "html-buttons",
      "module": "./content/styles/html-elements.md.buttons.ts",
      "source": "const content = e(\"div\", { ui: [\"elg\", \"d-flex\", \"gap-2\", \"flex-wrap\"] }, e(\"button\", { ui: [\"elg\"], type: \"button\" }, \"Flat button\"), cbutton({ ui: [\"elg\", \"btn\", \"primary\"] }, \"Primary\"), cbutton({ ui: [\"elg\", \"btn\", \"neutral\"] }, \"Neutral\"), cbutton({ ui: [\"elg\", \"btn\", \"danger\"] }, \"Danger\"));\ndocument.body.append(content);",
      "code": "const content = e(\"div\", { ui: [\"elg\", \"d-flex\", \"gap-2\", \"flex-wrap\"] }, e(\"button\", { ui: [\"elg\"], type: \"button\" }, \"Flat button\"), cbutton({ ui: [\"elg\", \"btn\", \"primary\"] }, \"Primary\"), cbutton({ ui: [\"elg\", \"btn\", \"neutral\"] }, \"Neutral\"), cbutton({ ui: [\"elg\", \"btn\", \"danger\"] }, \"Danger\"));\ndocument.body.append(content);",
      "mode": "readonly"
    },
    {
      "id": "html-form-controls",
      "module": "./content/styles/html-elements.md.form-controls.ts",
      "source": "const content = e(\"div\", { ui: [\"elg\", \"d-flex\", \"flex-col\", \"gap-2\"] }, e(\"input\", { ui: [\"elg\", \"field\"], type: \"text\", placeholder: \"Text input\" }), e(\"select\", { ui: [\"elg\", \"field\"] }, e(\"option\", { value: \"one\" }, \"Select an option\"), e(\"option\", { value: \"two\" }, \"Another option\")), e(\"textarea\", { ui: [\"elg\", \"field\"], rows: 3, placeholder: \"Textarea\" }), e(\"label\", { ui: [\"elg\", \"d-flex\", \"gap-1\", \"items-center\"] }, e(\"input\", { ui: [\"elg\"], type: \"checkbox\", checked: true }), \"Enable feature\"));\ndocument.body.append(content);",
      "code": "const content = e(\"div\", { ui: [\"elg\", \"d-flex\", \"flex-col\", \"gap-2\"] }, e(\"input\", { ui: [\"elg\", \"field\"], type: \"text\", placeholder: \"Text input\" }), e(\"select\", { ui: [\"elg\", \"field\"] }, e(\"option\", { value: \"one\" }, \"Select an option\"), e(\"option\", { value: \"two\" }, \"Another option\")), e(\"textarea\", { ui: [\"elg\", \"field\"], rows: 3, placeholder: \"Textarea\" }), e(\"label\", { ui: [\"elg\", \"d-flex\", \"gap-1\", \"items-center\"] }, e(\"input\", { ui: [\"elg\"], type: \"checkbox\", checked: true }), \"Enable feature\"));\ndocument.body.append(content);",
      "mode": "readonly"
    },
    {
      "id": "html-tables",
      "module": "./content/styles/html-elements.md.tables.ts",
      "source": "const rows = [\n    [\"Primary\", \"Main action\", \"primary\"],\n    [\"Success\", \"Completed state\", \"success\"],\n    [\"Warning\", \"Needs attention\", \"warning\"]\n];\nconst table = e(\"table\", { ui: [\"elg\", \"table\", \"table-row-borders\"] }, e(\"thead\", {}, e(\"tr\", {}, e(\"th\", {}, \"Role\"), e(\"th\", {}, \"Meaning\"), e(\"th\", {}, \"Preview\"))), e(\"tbody\", {}, ...rows.map(row => e(\"tr\", {}, e(\"td\", {}, row[0]), e(\"td\", {}, row[1]), e(\"td\", {}, e(\"span\", { ui: [\"elg\", row[2], \"px-2\", \"rounded-1\"] }, row[2]))))));\ndocument.body.append(table);",
      "code": "const rows = [\n    [\"Primary\", \"Main action\", \"primary\"],\n    [\"Success\", \"Completed state\", \"success\"],\n    [\"Warning\", \"Needs attention\", \"warning\"]\n];\nconst table = e(\"table\", { ui: [\"elg\", \"table\", \"table-row-borders\"] }, e(\"thead\", {}, e(\"tr\", {}, e(\"th\", {}, \"Role\"), e(\"th\", {}, \"Meaning\"), e(\"th\", {}, \"Preview\"))), e(\"tbody\", {}, ...rows.map(row => e(\"tr\", {}, e(\"td\", {}, row[0]), e(\"td\", {}, row[1]), e(\"td\", {}, e(\"span\", { ui: [\"elg\", row[2], \"px-2\", \"rounded-1\"] }, row[2]))))));\ndocument.body.append(table);",
      "mode": "readonly"
    }
  ]
};
