export default {
  "id": "editor-lifecycle",
  "title": "Values, confirmation and callbacks",
  "path": "/components/value-editors/lifecycle",
  "group": "components",
  "parent": "editors",
  "order": 11,
  "description": "Separate draft input, conversion, validation, asynchronous acceptance and cancellation.",
  "prev": "/components/value-editors",
  "next": "/components/value-editors/validation",
  "toc": true,
  "api": [
    "ValueEditor",
    "ValueEditorOptions",
    "TextEditorOptions",
    "PopoverEditorOptions"
  ],
  "keywords": [],
  "sectionRedirects": [],
  "html": "<h1>Values, confirmation and callbacks</h1>\n<h2 id=\"shared-contract\">Shared contract</h2>\n<pre class=\"shiki shiki-themes github-light github-dark\" style=\"background-color:#fff;--shiki-dark-bg:#24292e;color:#24292e;--shiki-dark:#e1e4e8\" tabindex=\"0\"><code><span class=\"line\"><span style=\"color:#D73A49;--shiki-dark:#F97583\">const</span><span style=\"color:#005CC5;--shiki-dark:#79B8FF\"> editor</span><span style=\"color:#D73A49;--shiki-dark:#F97583\"> =</span><span style=\"color:#D73A49;--shiki-dark:#F97583\"> new</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\"> TextEditor</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">({</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">    value: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"SO-1042\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">,</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">    label: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"Order reference\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">,</span></span>\n<span class=\"line\"><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">    validate</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">: </span><span style=\"color:#E36209;--shiki-dark:#FFAB70\">value</span><span style=\"color:#D73A49;--shiki-dark:#F97583\"> =></span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\"> value.</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">trim</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">() </span><span style=\"color:#D73A49;--shiki-dark:#F97583\">?</span><span style=\"color:#005CC5;--shiki-dark:#79B8FF\"> undefined</span><span style=\"color:#D73A49;--shiki-dark:#F97583\"> :</span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\"> \"Reference is required.\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">,</span></span>\n<span class=\"line\"><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">    onCommit</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">: </span><span style=\"color:#D73A49;--shiki-dark:#F97583\">async</span><span style=\"color:#E36209;--shiki-dark:#FFAB70\"> value</span><span style=\"color:#D73A49;--shiki-dark:#F97583\"> =></span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\"> { </span><span style=\"color:#D73A49;--shiki-dark:#F97583\">await</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\"> updateReference</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(value); }</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">});</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">editor.</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">mount</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(container);</span></span>\n<span class=\"line\"></span></code></pre>\n<p>Typing changes a draft; <code>confirmedValue</code> changes only after parsing, validation\nand <code>onCommit</code> succeed. <code>modified</code> includes unparsed text changes.\n<code>commit()</code> returns <code>Promise&lt;boolean&gt;</code>; a failure retains the draft and exposes\n<code>error</code>. Correct it or retry. <code>cancel()</code> restores the last accepted value.\n<code>setValue()</code> silently loads an external value as a new baseline.</p>\n<p><code>validate</code> and <code>onCommit</code> can be asynchronous. While either runs, <code>busy</code> is true\nand the control is unavailable. Concurrent commits share one operation;\n<code>cancel()</code> returns false while busy, and <code>setValue()</code> throws. An unchanged value\ndoes not call <code>onCommit</code>. Invalid fields have a danger-colored border.</p>\n<p><code>input</code>, <code>committed</code> and <code>cancelled</code> are synchronous notification events.\nUse <code>onCommit</code> for work that must be awaited. Values are retained by reference;\nequality defaults to <code>Object.is</code>, or supply <code>equals</code>. Editors do not undo external\nside effects: callbacks must manage their own recovery or transaction.</p>\n<h2 id=\"keyboard-and-popup-behavior\">Keyboard and popup behavior</h2>\n<p>Text and number editors accept Enter or leaving the field by default; use\n<code>commitOnBlur: false</code> when the form controls confirmation. Escape cancels.\nIME Enter does not confirm. Native text-navigation keys remain available.</p>\n<p>Popup trigger buttons do not add a Tab stop. Alt+Down opens a picker.\n<code>openOnFocus</code> defaults to false. When enabled, DateEditor focuses DatePicker;\nLookupEditor retains input focus for searching. Escape returns to text editing\nwithout reopening DatePicker. See each editor’s topic for picker navigation.</p>\n<h2 id=\"resolve-external-text\">Resolve external text</h2>\n<p>Every editor exposes <code>resolveText(text): T | Promise&lt;T&gt;</code> for clipboard/import\nconversion without editing, validation, saving or events. Failed conversion\nthrows or rejects. The host separately validates and applies the result.</p>\n<p>Text editors use <code>resolveText</code>, then <code>parse</code>, then their default conversion.\nNumber editors support decimal dot/comma; boolean editors accept true/false,\nyes/no and 1/0. Lookup requires a unique match; Date uses its configured pattern.</p>\n<h2 id=\"api-reference\">API reference</h2>\n<p><a href=\"?!=/api-reference/ValueEditor\">ValueEditor</a>,\n<a href=\"?!=/api-reference/ValueEditorOptions\">ValueEditorOptions</a>,\n<a href=\"?!=/api-reference/TextEditorOptions\">TextEditorOptions</a>,\n<a href=\"?!=/api-reference/PopoverEditorOptions\">PopoverEditorOptions</a>.</p>\n",
  "headings": [
    {
      "id": "shared-contract",
      "title": "Shared contract"
    },
    {
      "id": "keyboard-and-popup-behavior",
      "title": "Keyboard and popup behavior"
    },
    {
      "id": "resolve-external-text",
      "title": "Resolve external text"
    },
    {
      "id": "api-reference",
      "title": "API reference"
    }
  ],
  "demos": []
};
