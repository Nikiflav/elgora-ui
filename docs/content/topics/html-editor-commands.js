export default {
  "id": "html-editor-commands",
  "title": "Commands and formatting",
  "path": "/components/html-editor/commands",
  "group": "html-editor",
  "order": 40,
  "description": "Understand command definitions, target resolution, formatting and command execution.",
  "prev": "/components/html-editor/model",
  "next": "/components/html-editor/editing",
  "toc": true,
  "api": [
    "HtmlEditorCommand",
    "HtmlEditorUiCommand",
    "HtmlEditorCommandRegistry",
    "HtmlEditorUiCommandField",
    "HtmlEditorUiCommandTargets",
    "HtmlEditorUiCommandTargetContext",
    "HtmlEditorUiCommandResolution",
    "HtmlEditorResolvedUiCommandField"
  ],
  "keywords": [
    "commands",
    "formatting",
    "targets",
    "bold",
    "text style"
  ],
  "sectionRedirects": [],
  "html": "<h1>Commands and formatting</h1>\n<p>The editor has two related command layers. HtmlEditorCommand describes an\nediting operation applied to the model, such as inserting text, applying a mark\nor undoing a transaction. HtmlEditorUiCommand describes an application-facing\ncommand: its label, visibility, enabled state, current state, optional field\ndefinition and execute handler.</p>\n<h2 id=\"field-definitions-and-target-resolution\">Field definitions and target resolution</h2>\n<p>A command can contribute a DataForm field. The definition owns its field type,\ncaption, options, target resolver and value reader. visibleIn identifies the\npresentation slots that can show it: basic, advanced, toolbar or focused.\nPresentation metadata controls visual differences without duplicating the\ncommand or field definition.</p>\n<p>The captured HtmlEditorUiCommandTargetContext may contain both the remembered\ntext range and selected-node metadata. Each field resolves the application units\nit needs: text ranges, enclosing blocks or selected elements. A command can\nreport incomplete targets; the inspector can omit it while a compact surface\nkeeps it visible but disabled.</p>\n<p>The registry builds an HtmlEditorResolvedUiCommandField with the command,\nresolved context, current aggregate value and enabled state. It is a snapshot\nfor one presentation/edit and is rejected after a document generation change\nor command replacement. Selection and focus changes alone do not invalidate it.</p>\n<h2 id=\"applying-inline-formatting-and-styles\">Applying inline formatting and styles</h2>\n<p>Formatting commands and style fields use the same selection intent. For partial\ntext, fragmentSelection splits the selected portion into a wrapper such as\n<strong>, <em> or <span>, then returns an updated selection over those fragments.\nStyle commands apply the authored property to the fragment roots. A fully\nselected element can remain a target itself and receive the property without\nwrapping descendants.</p>\n<p>The fragmentation step creates complete element targets; the property step edits\nthose targets without recursively applying the property to every descendant.\nNormalization merges adjacent text nodes and equivalent neighboring inline marks\nwhere possible. With a collapsed caret, inline formatting and text styles update\nthe typing override for subsequent input.</p>\n<p>Clear Formatting uses the resolved selection or full-element target and removes\nsupported inline marks and authored text styles. Built-in fields include text\nmarks, paragraph type and alignment, text size, text color, background color,\nlink actions and history commands. The view does not decide whether a command\nacts on text, a block or an element.</p>\n<p>See <a href=\"?!=/components/html-editor/ui-surfaces\">Inspector and toolbar</a> for field\npresentation and <a href=\"?!=/components/html-editor/selection\">Selection</a> for text and\nnode target behavior.</p>\n<h2 id=\"core-operations-and-history\">Core operations and history</h2>\n<pre class=\"shiki shiki-themes github-light github-dark\" style=\"background-color:#fff;--shiki-dark-bg:#24292e;color:#24292e;--shiki-dark:#e1e4e8\" tabindex=\"0\"><code><span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">content.</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">execute</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">({ type: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"insertText\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, text: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"Hello\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\"> });</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">content.</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">execute</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">({ type: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"bold\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\"> });</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">content.</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">execute</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">({ type: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"insertParagraph\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\"> });</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">content.</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">execute</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">({ type: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"undo\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\"> });</span></span>\n<span class=\"line\"></span></code></pre>\n<p><code>execute()</code> returns false when an operation cannot be applied to the current\nselection or the editor is unavailable. Commands use the last editor selection,\nso a host toolbar can receive focus before invoking them. Bold and italic apply\nto a selected range across supported sibling text blocks, or change the format of subsequently\ntyped text at a collapsed caret. Moving the selection clears that typing override.</p>\n<p>Supported operations are <code>insertText</code>, <code>insertHtml</code>, <code>deleteBackward</code>,\n<code>deleteForward</code>, <code>insertParagraph</code>, <code>insertLineBreak</code>, <code>indent</code>, <code>outdent</code>, <code>bold</code>, <code>italic</code>, <code>undo</code>\nand <code>redo</code>. Commands use shared structural operations for positions, inline\nranges, splitting, merging and replacement. Their behavior follows the HTML\nelement’s semantics, independently of CSS display.</p>\n",
  "headings": [
    {
      "id": "field-definitions-and-target-resolution",
      "title": "Field definitions and target resolution"
    },
    {
      "id": "applying-inline-formatting-and-styles",
      "title": "Applying inline formatting and styles"
    },
    {
      "id": "core-operations-and-history",
      "title": "Core operations and history"
    }
  ],
  "demos": []
};
