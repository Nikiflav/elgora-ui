export default {
  "id": "html-editor-selection",
  "title": "Selection and focus",
  "path": "/components/html-editor/selection",
  "group": "html-editor",
  "order": 60,
  "description": "Understand the remembered text range, node targets, focus and selection visualization.",
  "prev": "/components/html-editor/editing",
  "next": "/components/html-editor/ui-surfaces",
  "toc": true,
  "api": [
    "HtmlEditorSelectionRange",
    "HtmlEditorNodeCoverage",
    "HtmlEditorSurface"
  ],
  "keywords": [
    "selection",
    "focus",
    "overlay",
    "inspector",
    "range"
  ],
  "sectionRedirects": [],
  "html": "<h1>Selection and focus</h1>\n<p>The editor keeps the text range and inspector node targets as separate, simultaneous\npieces of intent. A tree preview can change the target node without moving the\nremembered caret or widening the text range. Commands resolve applicable targets\nfrom both pieces according to their own semantics.</p>\n<h2 id=\"text-selection-node-targets-and-focus\">Text selection, node targets and focus</h2>\n<p>For a non-collapsed range, the selector displays <strong>Mixed</strong> when selected content\nbelongs to multiple text/atomic elements. Enclosing shells alone do not make a\nsingle text owner mixed. The tree uses the same interval coverage as Copy/Delete:\nfully and partially covered nodes share the same blue background. A circular\nindicator after the tag shows coverage: empty for unselected, half-filled for\npartial, filled for full, with a localized tooltip. These are decorative status\nindicators, not checkboxes. A right-arrow icon (tooltip: “Keyboard focus”) in a fixed gutter at the start of the focused row, before indentation and the disclosure chevron, replaces\nthe dotted focus outline in this HTML tree only; the tree viewport retains its\nfocus frame. Empty elements and images count only when their own interval is covered.\nOpening the tree reveals partial endpoint containers; fully selected subtrees can\nremain collapsed and show their coverage on the parent. Their descendants receive\nthe same marks when expanded. A caret alone has no range-coverage marks.</p>\n<p>Coverage is separate from the tree’s keyboard focus and single inspection-preview\nchoice. Choosing a preview may replace the Mixed label until the next text-selection\nchange, but never changes the range or its highlights. Coverage is also announced\nin the accessible row labels. Only this HTML tree uses a monospace font, gray tag\nbadges and muted descriptions; the selector uses the same label rendering in a\ntransparent, borderless-looking ghost button, with standard hover and keyboard-focus\nfeedback. Ordinary TreeView appearance is unchanged.</p>\n<p>The breadcrumb above the selector lists only the three nearest <strong>parents</strong>, not\nthe current element (already shown in the selector). A leading <strong>…</strong> opens earlier\nancestors in document order. Every ancestor can be previewed without moving the\ntext selection or adding an undo entry; keyboard activation uses native buttons,\nand Escape closes the overflow popup and returns focus to its trigger.\nFor <strong>Mixed</strong>, the path includes the nearest common ancestor of the selected\ncontent owners. If no authored element contains the whole range, the path is hidden:\nthe virtual document root is not shown as an invented <code>body</code> element. Root-level\ninspection targets also have no parent breadcrumb. The path remains single-line.</p>\n<p><code>selection</code> returns a detached snapshot of the last selection inside the editor.\nEach endpoint contains a <code>nodeId</code> and an <code>offset</code>. Text offsets count UTF-16 units;\nelement offsets count supported child nodes. The content root also has its own\nidentity, allowing ranges between top-level blocks. <code>nativeSelection</code> exposes the\nlive browser selection only while both endpoints belong to this editor.</p>\n<pre class=\"shiki shiki-themes github-light github-dark\" style=\"background-color:#fff;--shiki-dark-bg:#24292e;color:#24292e;--shiki-dark:#e1e4e8\" tabindex=\"0\"><code><span class=\"line\"><span style=\"color:#D73A49;--shiki-dark:#F97583\">const</span><span style=\"color:#005CC5;--shiki-dark:#79B8FF\"> savedSelection</span><span style=\"color:#D73A49;--shiki-dark:#F97583\"> =</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\"> content.selection;</span></span>\n<span class=\"line\"><span style=\"color:#6A737D;--shiki-dark:#6A737D\">// A toolbar or inspector may receive focus here.</span></span>\n<span class=\"line\"><span style=\"color:#D73A49;--shiki-dark:#F97583\">if</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\"> (savedSelection) content.</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">restoreSelection</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(savedSelection);</span></span>\n<span class=\"line\"></span></code></pre>\n<p><code>selectionChanged</code> emits detached snapshots when the remembered range changes.\nMoving focus or selecting text outside the editor retains the last editor range.\n<code>restoreSelection()</code> without an argument restores that remembered range and focuses\nthe editing surface. Forward and backward ranges retain their direction.</p>\n<p>Identities survive native input while the same DOM nodes survive. Commands map their\nresulting selection to the updated model. Removed endpoints\ninvalidate the remembered range; offsets are clamped when text becomes shorter.\n<code>setHtml()</code>, cancellation and a successful modified commit rebuild the content and\ninvalidate saved identities. Snapshots are local to one editor and document scope;\nthey are not persistent bookmarks across document replacements. Use <code>execute()</code>\nto edit content; restoring a selection alone does not change the document.</p>\n<h2 id=\"selection-overlay\">Selection overlay</h2>\n<p>The overlay visualizes the active command target rather than a generic hover over\nthe editor chrome. Text-flow ranges are drawn by line, while structural containers\nsuch as cells and layout items retain separate geometry outlines. A\ncommand-specific preview asks the registry for that command’s resolved targets.</p>\n<p>See <a href=\"?!=/components/html-editor/ui-surfaces\">Inspector and toolbar</a> for tree\nselection and <a href=\"?!=/components/html-editor/commands\">Commands and formatting</a> for\ncommand target resolution.</p>\n",
  "headings": [
    {
      "id": "text-selection-node-targets-and-focus",
      "title": "Text selection, node targets and focus"
    },
    {
      "id": "selection-overlay",
      "title": "Selection overlay"
    }
  ],
  "demos": []
};
