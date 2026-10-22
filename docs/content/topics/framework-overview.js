export default {
  "id": "framework-overview",
  "title": "Elements and components",
  "path": "/getting-started/framework-overview",
  "group": "fundamentals",
  "order": 10,
  "description": "Choose native elements or owned components and compose them with e() and c().",
  "prev": "/getting-started/quick-start",
  "next": "/fundamentals/state-and-events",
  "toc": true,
  "api": [
    "Component",
    "cdiv",
    "cbutton",
    "e",
    "ObservableValue",
    "ObservableEvent",
    "ElgoraUI"
  ],
  "keywords": [
    "framework",
    "observable",
    "event",
    "theme",
    "ui styles",
    "css variables"
  ],
  "sectionRedirects": [
    "api-reference|/getting-started/framework-overview#related-topics",
    "see-also|/getting-started/framework-overview#related-topics",
    "ui-styles|/styles/overview#ui-styles",
    "the-elg-base-class|/styles/overview#the-elg-base-class",
    "color-system|/styles/overview#color-system",
    "css-utilities|/styles/overview#css-utilities",
    "component-classes-box-btn-and-future-additions|/styles/overview#component-classes-box-btn-and-future-additions",
    "reactive-values-and-events|/fundamentals/state-and-events#reactive-values-and-events",
    "binding-observable-state-to-the-dom|/fundamentals/state-and-events#binding-observable-state-to-the-dom"
  ],
  "html": "<h1>Elements and components</h1>\n<h2 id=\"overview\">Overview</h2>\n<p>ElgoraUI is a browser-native framework for building self-contained web apps. Its foundation is a small set of composable components, native DOM elements, observable state, explicit events, and a token-based UI style system.</p>\n<p>The examples on this page are live and editable. They use plain JavaScript and run directly in the browser, so the code you learn here is also the code you can use in an ordinary HTTP-served application. The playground exposes the common ElgoraUI factories directly, so one-off elements can be composed without an <code>Elgora.</code> prefix.</p>\n<h2 id=\"elements-and-components\">Elements and components</h2>\n<p>Use <code>e()</code> when you need a native DOM element. Use a <code>Component</code> or a <code>c*</code> factory when the element should have component state, lifecycle, rendering, or bindings.</p>\n<div data-live-demo=\"framework-composition\"></div>\n<p>The <code>c*</code> factories create <code>Component</code> instances, while <code>e()</code> creates native elements when a component lifecycle is not needed. Both accept normal DOM properties and children. A component can be mounted into any ordinary DOM element; no application-wide runtime object or template compiler is required.</p>\n<h2 id=\"related-topics\">Related topics</h2>\n<ul>\n<li><a href=\"?!=/fundamentals/state-and-events\">State, events and bindings</a></li>\n<li><a href=\"?!=/fundamentals/rendering\">Rendering and VNodes</a></li>\n<li><a href=\"?!=/components\">Lifecycle and resource ownership</a></li>\n<li><a href=\"?!=/styles/overview\">UI styles and utilities</a></li>\n</ul>\n",
  "headings": [
    {
      "id": "overview",
      "title": "Overview"
    },
    {
      "id": "elements-and-components",
      "title": "Elements and components"
    },
    {
      "id": "related-topics",
      "title": "Related topics"
    }
  ],
  "demos": [
    {
      "id": "framework-composition",
      "module": "./content/getting-started/framework-overview.md.composition.ts",
      "source": "const content = cdiv({ ui: [\"elg\", \"surface\", \"box\", \"p-3\", \"d-flex\", \"flex-col\", \"gap-2\"] }, e(\"strong\", { ui: [\"elg\"] }, \"Hello from ElgoraUI\"), e(\"span\", { ui: [\"elg\", \"text-muted\"] }, \"A native DOM tree with Elgora behavior.\"), cbutton({ ui: [\"elg\", \"btn\", \"primary\"] }, \"Change message\"));\ncontent.mount(document.body);",
      "code": "const content = cdiv({ ui: [\"elg\", \"surface\", \"box\", \"p-3\", \"d-flex\", \"flex-col\", \"gap-2\"] }, e(\"strong\", { ui: [\"elg\"] }, \"Hello from ElgoraUI\"), e(\"span\", { ui: [\"elg\", \"text-muted\"] }, \"A native DOM tree with Elgora behavior.\"), cbutton({ ui: [\"elg\", \"btn\", \"primary\"] }, \"Change message\"));\ncontent.mount(document.body);",
      "sourceHtml": "<pre class=\"shiki shiki-themes github-light github-dark\" style=\"background-color:#fff;--shiki-dark-bg:#24292e;color:#24292e;--shiki-dark:#e1e4e8\" tabindex=\"0\"><code><span class=\"line\"><span style=\"color:#D73A49;--shiki-dark:#F97583\">const</span><span style=\"color:#005CC5;--shiki-dark:#79B8FF\"> content</span><span style=\"color:#D73A49;--shiki-dark:#F97583\"> =</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\"> cdiv</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">({ ui: [</span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"elg\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"surface\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"box\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"p-3\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"d-flex\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"flex-col\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"gap-2\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">] }, </span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">e</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(</span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"strong\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, { ui: [</span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"elg\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">] }, </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"Hello from ElgoraUI\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">), </span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">e</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(</span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"span\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, { ui: [</span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"elg\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"text-muted\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">] }, </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"A native DOM tree with Elgora behavior.\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">), </span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">cbutton</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">({ ui: [</span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"elg\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"btn\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"primary\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">] }, </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"Change message\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">));</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">content.</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">mount</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(document.body);</span></span></code></pre>"
    }
  ]
};
