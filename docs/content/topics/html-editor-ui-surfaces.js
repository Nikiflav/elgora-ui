export default {
  "id": "html-editor-ui-surfaces",
  "title": "Inspector and toolbar",
  "path": "/components/html-editor/ui-surfaces",
  "group": "html-editor",
  "order": 70,
  "description": "Learn how the toolbar, inspector, tree and link dialog present shared editor state.",
  "prev": "/components/html-editor/selection",
  "next": "/components/html-editor/insertion-and-clipboard",
  "toc": true,
  "api": [
    "HtmlEditorToolbar",
    "HtmlEditorInspector",
    "HtmlEditorUiCommandFieldService",
    "HtmlEditorUiCommandPresentation",
    "HtmlEditorUiCommandPresentationKind",
    "HtmlEditorUiCommandFormRow"
  ],
  "keywords": [
    "toolbar",
    "inspector",
    "DataForm",
    "TreeView",
    "link dialog"
  ],
  "sectionRedirects": [],
  "html": "<h1>Inspector and toolbar</h1>\n<p>The toolbar and inspector are different presentations of the same UI command\ndefinitions. The command registry owns the fields and their behavior; each\npresentation chooses which fields to show and how to lay them out.\nThe editor creates and owns the toolbar above the surface and the inspector on\nthe right because the demo enables <code>toolbar: true</code> and <code>inspector: true</code>.\nBoth options default to false, preserving the compact editor. They are construction\noptions; this first scaffold does not provide runtime visibility toggles.</p>\n<p>The toolbar runs the existing Bold, Italic, Undo and Redo commands, with disabled\nstates and arrow-key navigation. The inspector’s selector opens a virtualized\n<a href=\"?!=/components/tree-view\">TreeView</a> showing tags and shortened descriptions. It\nfollows the text caret; choosing a tree item previews an inspection target without\nchanging the remembered caret, document or history. <strong>Properties</strong> contains compact\nBasic commands such as Bold, Italic, block type, text color, text size and alignment.\nCommands with choices use one shared Lookup editor and commit through the same model\ntransaction and Undo/Redo history as the editing surface. <strong>Advanced</strong> remains the\nplace for direct classes, attributes and styles in a later step.\nOn narrow screens this first layout stacks the inspector below the surface;\na responsive drawer and resizable panel are future work.</p>\n<h2 id=\"toolbar\">Toolbar</h2>\n<p>The toolbar uses a compact horizontal DataForm. It selects an ordered subset\nof fields and requests the toolbar presentation. The shared field service\nconverts command definitions into DataForm fields, including compact icons,\nmenus, current state and command activation.</p>\n<h2 id=\"inspector\">Inspector</h2>\n<p>The inspector combines a model-element selector, virtualized TreeView, TabView\ncategories and a vertical DataForm. It requests fields for the basic presentation.\nCategories and layout belong to this surface; field captions, target resolution,\nvalues and edit behavior come from the commands.</p>\n<p>The inspector’s node preview does not replace the text selection. The text range\nand node targets can coexist, and each command determines which is applicable.\nSee <a href=\"?!=/components/html-editor/selection\">Selection and focus</a>.</p>\n<h2 id=\"link-dialog-uses-a-staged-draft\">Link dialog uses a staged draft</h2>\n<p>The toolbar’s link button opens the internal link dialog. Its URL, target and\ntitle fields are local DataForm fields over a temporary draft initialized from\nthe current link context. Choosing a value changes only that draft; Apply submits\nthe link change as one operation, while Cancel discards it. These fields are\nseparate from the inspector’s registry-backed field bindings.</p>\n<h2 id=\"shared-field-presentation-contract\">Shared field presentation contract</h2>\n<p>A command field can present data input or action buttons. Presentation metadata\ncan provide distinct visual settings per slot. The inspector can show a full\nlabeled value editor while the toolbar uses an icon button with the same options\nand command state. Neither surface creates a second command definition or owns\ntarget-resolution rules.</p>\n<p>The contract includes a focused presentation slot. The link dialog uses its own\nstaged draft because it applies several properties together; it does not render\nthe registry’s focused field bindings.</p>\n<p>See <a href=\"?!=/components/html-editor/architecture\">Architecture and data flow</a> and\n<a href=\"?!=/components/html-editor/commands\">Commands and formatting</a>.</p>\n",
  "headings": [
    {
      "id": "toolbar",
      "title": "Toolbar"
    },
    {
      "id": "inspector",
      "title": "Inspector"
    },
    {
      "id": "link-dialog-uses-a-staged-draft",
      "title": "Link dialog uses a staged draft"
    },
    {
      "id": "shared-field-presentation-contract",
      "title": "Shared field presentation contract"
    }
  ],
  "demos": []
};
