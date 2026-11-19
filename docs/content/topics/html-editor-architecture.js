export default {
  "id": "html-editor-architecture",
  "title": "Architecture",
  "path": "/components/html-editor/architecture",
  "group": "html-editor",
  "order": 20,
  "description": "Understand HtmlEditor ownership, command flow and the shared editing model.",
  "prev": "/components/html-editor/overview",
  "next": "/components/html-editor/model",
  "toc": true,
  "api": [
    "HtmlEditor",
    "HtmlEditorSurface",
    "HtmlEditorCommandRegistry",
    "HtmlEditorUiCommandFieldService",
    "HtmlEditorToolbar",
    "HtmlEditorInspector"
  ],
  "keywords": [
    "architecture",
    "components",
    "command flow",
    "model"
  ],
  "sectionRedirects": [],
  "html": "<h1>Architecture and data flow</h1>\n<p>HtmlEditor has one editing model and several coordinated interfaces around it.\nThe interfaces present commands and state; the surface remains the sole owner of\ndocument mutations, selection mapping and history.</p>\n<h2 id=\"component-responsibilities\">Component responsibilities</h2>\n<table>\n<thead>\n<tr>\n<th>Component</th>\n<th>Responsibility</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td><code>HtmlEditor</code></td>\n<td>Public ValueEditor wrapper. Owns the accepted value and draft lifecycle, creates the surface and optional UI, and exposes the common editor API.</td>\n</tr>\n<tr>\n<td><code>HtmlEditorSurface</code></td>\n<td>Owns the editable DOM, structured document, DOM/model mapping, remembered selection, input reconciliation and Undo/Redo history.</td>\n</tr>\n<tr>\n<td><code>HtmlEditorCommandRegistry</code></td>\n<td>Owns UI command definitions and dispatch. Resolves command targets, values and enabled state, then routes actions to the surface.</td>\n</tr>\n<tr>\n<td><code>HtmlEditorUiCommandController</code></td>\n<td>Internal lifecycle coordinator. Creates the field service and optional toolbar/inspector, subscribes to surface events and refreshes both views together.</td>\n</tr>\n<tr>\n<td><code>HtmlEditorUiCommandFieldService</code></td>\n<td>Projects a resolved command field into DataForm metadata and shares adapter behavior across the toolbar and inspector.</td>\n</tr>\n<tr>\n<td><code>HtmlEditorToolbar</code> and <code>HtmlEditorInspector</code></td>\n<td>Presentation components. The toolbar presents a compact subset; the inspector presents the tree, tabs and full command fields.</td>\n</tr>\n<tr>\n<td>Selection overlay and command menu</td>\n<td>Editor-owned visual and menu surfaces. They use shared selection and registry state, not another document model.</td>\n</tr>\n</tbody>\n</table>\n<h2 id=\"update-and-command-flow\">Update and command flow</h2>\n<ol>\n<li>The surface maps supported browser input to the document model and emits\ndocument, selection and interaction events.</li>\n<li>The controller subscribes once and refreshes both presentations from the same\nmodel and selection generation.</li>\n<li>A presentation requests fields from the field service. It delegates target\nand value resolution to the registry, then maps the binding to DataForm fields.</li>\n<li>A command action returns through the registry, which validates the captured\nbinding before dispatch.</li>\n<li>The command updates the surface. The surface renders the model change and\nrecords one history transaction.</li>\n<li>The controller refreshes both views. Separately, the host accepts the HTML\nwith commit() or restores the accepted value with cancel().</li>\n</ol>\n<p>The command menu uses the same registry but does not need DataForm. The toolbar\nand inspector use DataForm because they need different layouts for shared fields.</p>\n<h2 id=\"lifecycle-boundary\">Lifecycle boundary</h2>\n<p><code>HtmlEditorSurface</code> is a standalone <code>Component</code>. It owns the contenteditable area,\nmodel, DOM mapping, text selection, input handling and the single Undo/Redo history.\nIt does not have <code>value</code>, <code>confirmedValue</code>, <code>commit()</code> or <code>cancel()</code>.</p>\n<p><code>HtmlEditor</code> remains a <code>ValueEditor&lt;string&gt;</code>. It creates and disposes one surface\nand the optional <code>HtmlEditorToolbar</code>/<code>HtmlEditorInspector</code>, connects their events,\nand owns parsing/validation/external acceptance through the value-editor lifecycle.\nThe existing <code>content</code>, <code>document</code>, <code>selection</code>, <code>execute</code>, <code>canUndo</code> and <code>canRedo</code>\nAPI delegates to that same surface; no second model or history is maintained.\nUse <code>editor.setHtml()</code> for an accepted baseline, not <code>editor.surface.setHtml()</code>:\nthe low-level surface method only replaces its document and resets its history.</p>\n<p>For a custom host that needs only the editing area:</p>\n<pre class=\"shiki shiki-themes github-light github-dark\" style=\"background-color:#fff;--shiki-dark-bg:#24292e;color:#24292e;--shiki-dark:#e1e4e8\" tabindex=\"0\"><code><span class=\"line\"><span style=\"color:#D73A49;--shiki-dark:#F97583\">const</span><span style=\"color:#005CC5;--shiki-dark:#79B8FF\"> surface</span><span style=\"color:#D73A49;--shiki-dark:#F97583\"> =</span><span style=\"color:#D73A49;--shiki-dark:#F97583\"> new</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\"> HtmlEditorSurface</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">({ html: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"&#x3C;p>Hello&#x3C;/p>\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, label: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"Content\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\"> });</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">surface.</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">mount</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(container);</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">surface.input.</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">subscribe</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(() </span><span style=\"color:#D73A49;--shiki-dark:#F97583\">=></span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\"> console.</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">log</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(surface.html));</span></span>\n<span class=\"line\"></span></code></pre>\n<p>The host owns saving and any baseline when using the surface directly. The built-in\ntoolbar and inspector never save content or create their own edit history.</p>\n<p>A standalone surface leaves baseline and persistence to its host:</p>\n<pre><code>const surface = new HtmlEditorSurface({ html: \"&lt;p&gt;Hello&lt;/p&gt;\", label: \"Content\" });\nsurface.mount(container);\nsurface.input.subscribe(() =&gt; console.log(surface.html));</code></pre>",
  "headings": [
    {
      "id": "component-responsibilities",
      "title": "Component responsibilities"
    },
    {
      "id": "update-and-command-flow",
      "title": "Update and command flow"
    },
    {
      "id": "lifecycle-boundary",
      "title": "Lifecycle boundary"
    }
  ],
  "demos": []
};
