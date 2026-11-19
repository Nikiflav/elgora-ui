export default {
  "id": "html-editor-model",
  "title": "Document model",
  "path": "/components/html-editor/model",
  "group": "html-editor",
  "order": 30,
  "description": "Learn how HTML nodes, authored styles and editor identities are represented.",
  "prev": "/components/html-editor/architecture",
  "next": "/components/html-editor/commands",
  "toc": true,
  "api": [
    "HtmlEditorDocument",
    "HtmlEditorNode",
    "HtmlEditorNodeId",
    "HtmlEditorText",
    "HtmlEditorElement",
    "HtmlEditorStyle",
    "getHtmlEditorStyle",
    "setHtmlEditorStyle",
    "removeHtmlEditorStyle",
    "getHtmlEditorElementBehavior"
  ],
  "keywords": [
    "model",
    "nodes",
    "HTML",
    "styles",
    "attributes"
  ],
  "sectionRedirects": [],
  "html": "<h1>Document model</h1>\n<p>The document contains two node types: a text leaf <code>{ id, type: &quot;text&quot;, text }</code>\nand an HTML element <code>{ id, type: &quot;element&quot;, tag, classes, styles, attributes, children }</code>.\nImages, video and table cells are ordinary elements identified by their tag.\nTheir properties live only in <code>attributes</code>: for example <code>src</code>, <code>alt</code>, <code>rowspan</code>\nand <code>colspan</code> remain HTML strings. Boolean attributes use presence with an empty\nstring, such as <code>controls: &quot;&quot;</code>; absence means the attribute is not set. Rendering\ndoes not add media attributes such as <code>controls</code> or <code>alt</code> automatically.</p>\n<p><code>id</code> is the editor’s internal identity. An authored HTML ID such as <code>id=&quot;intro&quot;</code>\nlives in <code>attributes.id</code>. <code>classes</code> stores unique tokens in authored order;\n<code>class</code> and <code>style</code> are never duplicated inside <code>attributes</code>.</p>\n<p><code>styles</code> is an ordered array of <code>{ name, value, important? }</code> declarations. It\nretains duplicate declarations, shorthand/longhand order, fallback values and\n<code>!important</code>. Standard names use CSS notation, for example <code>background-color</code>;\ncustom-property names such as <code>--Card-gap</code> are case-sensitive. The model stores\nauthored inline CSS; computed styles from a stylesheet are not copied into it.\nStructural editing rules are independent of an element’s CSS <code>display</code> value.</p>\n<pre class=\"shiki shiki-themes github-light github-dark\" style=\"background-color:#fff;--shiki-dark-bg:#24292e;color:#24292e;--shiki-dark:#e1e4e8\" tabindex=\"0\"><code><span class=\"line\"><span style=\"color:#D73A49;--shiki-dark:#F97583\">const</span><span style=\"color:#005CC5;--shiki-dark:#79B8FF\"> gap</span><span style=\"color:#D73A49;--shiki-dark:#F97583\"> =</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\"> getHtmlEditorStyle</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(element.styles, </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"gap\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">);</span></span>\n<span class=\"line\"><span style=\"color:#D73A49;--shiki-dark:#F97583\">const</span><span style=\"color:#005CC5;--shiki-dark:#79B8FF\"> updatedStyles</span><span style=\"color:#D73A49;--shiki-dark:#F97583\"> =</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\"> setHtmlEditorStyle</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(element.styles, </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"gap\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"16px\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">);</span></span>\n<span class=\"line\"><span style=\"color:#D73A49;--shiki-dark:#F97583\">const</span><span style=\"color:#005CC5;--shiki-dark:#79B8FF\"> withoutGap</span><span style=\"color:#D73A49;--shiki-dark:#F97583\"> =</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\"> removeHtmlEditorStyle</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(updatedStyles, </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"gap\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">);</span></span>\n<span class=\"line\"></span></code></pre>\n<p>These helpers prepare declaration lists without mutating the input array and share\nunmodified declarations. Setting a property removes its previous exact-name\ndeclarations and appends the replacement; other shorthand/longhand declarations\nretain their order. Lookup respects priority for the exact property name, but\ndoes not compute shorthand expansion or stylesheet inheritance. The helpers do\nnot apply property edits to the live editor themselves.</p>\n<p>For how the model is edited and rendered, see <a href=\"?!=/components/html-editor/architecture\">Architecture</a> and <a href=\"?!=/components/html-editor/editing\">Editing behavior</a>.</p>\n",
  "headings": [],
  "demos": []
};
