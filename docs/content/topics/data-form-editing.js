export default {
  "id": "data-form-editing",
  "title": "Editing and actions",
  "path": "/components/data-form/editing",
  "group": "components",
  "parent": "forms",
  "order": 30,
  "description": "Data binding, keyboard navigation, validation and action buttons in DataForm.",
  "prev": "/components/tab-view",
  "next": "/popover",
  "toc": true,
  "api": [],
  "keywords": [],
  "sectionRedirects": [],
  "html": "<h1>Editing and actions</h1>\n<p>DataForm reuses <code>DataViewField</code> and the DataGrid editor factory. Click a value\nor press Enter/F2 to edit. Typing in a focused value replaces its text.\nEnter and Tab accept the edit and enter the next editable field; Shift+Tab\nmoves backwards. Escape cancels. Open picker popups handle their own keys first.\nNavigation follows layout order and skips readonly and button fields.</p>\n<h2 id=\"values-and-validation\">Values and validation</h2>\n<p>A plain object is edited as a shallow draft available through <code>form.value</code>.\nA DataRow writes accepted values through <code>setValue</code>, preserving business rules\nand change tracking. Validation runs at commit. Rejected input keeps the editor\nand error visible. Use an explicit adapter for domain-specific storage, and\n<code>onCommit</code> for notification after acceptance.</p>\n<h2 id=\"action-fields\">Action fields</h2>\n<p>Declare <code>type: &quot;buttons&quot;</code> and a <code>buttons</code> collection. Buttons support icons,\ntext, tooltips, custom UI styles, visibility, disabled and pressed states,\nand an optional content renderer. The host supplies <code>row</code>, <code>field</code> and <code>owner</code>\nto callbacks. Buttons remain individual keyboard targets.</p>\n<pre class=\"shiki shiki-themes github-light github-dark\" style=\"background-color:#fff;--shiki-dark-bg:#24292e;color:#24292e;--shiki-dark:#e1e4e8\" tabindex=\"0\"><code><span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">{ </span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">name</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"actions\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, </span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">type</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"buttons\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, </span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">hideLabel</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">: </span><span style=\"color:#005CC5;--shiki-dark:#79B8FF\">true</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, </span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">buttons</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">: [</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">    { id: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"accept\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, text: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"Accept\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, icon: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"ri-check-line\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, </span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">onClick</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">: ({ </span><span style=\"color:#E36209;--shiki-dark:#FFAB70\">owner</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\"> }) </span><span style=\"color:#D73A49;--shiki-dark:#F97583\">=></span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">        save</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">((owner </span><span style=\"color:#D73A49;--shiki-dark:#F97583\">as</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\"> DataForm</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">&#x3C;</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">Order</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">>).value);</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">    } }</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">] }</span></span>\n<span class=\"line\"></span></code></pre>\n<p>See the <a href=\"?!=/components/data-form\">Overview demo</a> for plain-object and DataRow\nadapters, lookup and date editors, validation and actions.</p>\n",
  "headings": [
    {
      "id": "values-and-validation",
      "title": "Values and validation"
    },
    {
      "id": "action-fields",
      "title": "Action fields"
    }
  ],
  "demos": []
};
