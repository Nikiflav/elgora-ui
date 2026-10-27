export default {
  "id": "tab-view",
  "title": "TabView",
  "path": "/components/tab-view",
  "group": "components",
  "parent": "navigation",
  "order": 25,
  "description": "Compact accessible tabs with persistent panels and keyboard navigation.",
  "prev": "/components/filter-editor",
  "next": "/components/data-form/editing",
  "toc": true,
  "api": [
    "TabView",
    "TabViewOptions",
    "TabViewItem"
  ],
  "keywords": [],
  "sectionRedirects": [],
  "html": "<h1>TabView</h1>\n<p>Compact tabs separate related tool panels. The active tab shares its panel’s\nbackground, while inactive tabs use a muted surface and thin separators.\nBoth light and dark themes use the standard theme colors.</p>\n<div data-live-demo=\"tab-view\"></div>\n<h2 id=\"selection-and-content\">Selection and content</h2>\n<p>Provide <code>items</code> with stable <code>id</code>, <code>text</code>, optional <code>content</code> and <code>disabled</code>.\n<code>selectedId</code> sets the initial enabled tab. <code>select(id)</code> activates a tab;\n<code>selectionChanged</code> reports its ID. Hidden panels remain mounted, retaining\ndraft inputs and component state. Content can be DOM nodes or Components.\n<code>getPanel(id)</code> returns a persistent panel, and <code>setTabText(id, text)</code> updates\ntranslated labels without replacing buttons.</p>\n<h2 id=\"keyboard-navigation\">Keyboard navigation</h2>\n<p>Tab enters the active tab. Left/Right arrows activate neighboring enabled tabs\nwith wrapping; Home/End activate the first/last enabled tab. Disabled tabs are\nskipped. Panels expose accessible tab/tabpanel relationships. Supply <code>label</code>\nto name the tab list.</p>\n",
  "headings": [
    {
      "id": "selection-and-content",
      "title": "Selection and content"
    },
    {
      "id": "keyboard-navigation",
      "title": "Keyboard navigation"
    }
  ],
  "demos": [
    {
      "id": "tab-view",
      "module": "./content/components/tab-view.md.ts",
      "source": "new TabView({ label: \"Inspector\", items: [\n        { id: \"properties\", text: \"Properties\", content: e(\"div\", {}, e(\"p\", {}, \"Basic element properties\"), e(\"input\", { value: \"A persistent draft\", ariaLabel: \"Draft\" })) },\n        { id: \"advanced\", text: \"Advanced\", content: \"Classes, attributes and styles\" },\n        { id: \"unavailable\", text: \"Unavailable\", disabled: true }\n    ] }).mount(document.body);",
      "code": "new TabView({ label: \"Inspector\", items: [\n        { id: \"properties\", text: \"Properties\", content: e(\"div\", {}, e(\"p\", {}, \"Basic element properties\"), e(\"input\", { value: \"A persistent draft\", ariaLabel: \"Draft\" })) },\n        { id: \"advanced\", text: \"Advanced\", content: \"Classes, attributes and styles\" },\n        { id: \"unavailable\", text: \"Unavailable\", disabled: true }\n    ] }).mount(document.body);",
      "sourceHtml": "<pre class=\"shiki shiki-themes github-light github-dark\" style=\"background-color:#fff;--shiki-dark-bg:#24292e;color:#24292e;--shiki-dark:#e1e4e8\" tabindex=\"0\"><code><span class=\"line\"><span style=\"color:#D73A49;--shiki-dark:#F97583\">new</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\"> TabView</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">({ label: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"Inspector\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, items: [</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">        { id: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"properties\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, text: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"Properties\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, content: </span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">e</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(</span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"div\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, {}, </span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">e</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(</span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"p\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, {}, </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"Basic element properties\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">), </span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">e</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(</span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"input\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, { value: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"A persistent draft\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, ariaLabel: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"Draft\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\"> })) },</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">        { id: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"advanced\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, text: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"Advanced\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, content: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"Classes, attributes and styles\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\"> },</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">        { id: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"unavailable\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, text: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"Unavailable\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, disabled: </span><span style=\"color:#005CC5;--shiki-dark:#79B8FF\">true</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\"> }</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">    ] }).</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">mount</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(document.body);</span></span></code></pre>",
      "height": "200px"
    }
  ]
};
