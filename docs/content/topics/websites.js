export default {
  "id": "websites",
  "title": "Building a website — Forma",
  "path": "/styles/websites",
  "group": "styles",
  "order": 90,
  "description": "Build a fictional product website with composable layouts, gradients and accessible scroll reveals.",
  "prev": "/styles/motion",
  "toc": true,
  "api": [],
  "keywords": [],
  "sectionRedirects": [
    "containers-sections-and-typography|/styles/containers#containers-sections-and-typography",
    "gradients|/styles/surfaces#gradients",
    "revealing-content-on-scroll|/styles/motion#revealing-content-on-scroll",
    "rotating-disclosure-icons|/styles/motion#rotating-disclosure-icons",
    "accessibility-and-fallback|/styles/motion#accessibility-and-fallback"
  ],
  "html": "<h1>Website composition and motion</h1>\n<p><strong>Forma</strong> is a fictional creative workspace. This example combines ordinary HTML,\ntyped <code>ui</code> styles, observable state and keyed VNodes into a product landing page.\nThere is no real service, account, server request, or external image/font dependency.</p>\n<p><a href=\"./forma.html\" target=\"_blank\" rel=\"noopener\">Open Forma as a full website ↗</a></p>\n<h2 id=\"try-the-website\">Try the website</h2>\n<p>Switch <strong>Board / List</strong>, check off tasks in the workspace, toggle light/dark mode,\nand scroll through the sections. The FAQ uses native <code>details</code> elements. Sample\nillustrations are CSS, not screenshots of an application. Changes reset on reload.</p>\n<div data-live-demo=\"forma-website\"></div>\n<h2 id=\"how-it-is-built\">How it is built</h2>\n<p>Forma combines reusable library primitives, not a site-specific framework. Its layout uses containers and the responsive grid; tokens provide surfaces and gradients; Component bindings and keyed VNodes update the workspace; ScrollReveal owns the entrance effects. Brand artwork and copy belong to this example, not the library.</p>\n<p>Start with ordinary semantic HTML, add styles, then add a Component only where state or resource ownership is needed.</p>\n<h2 id=\"related-topics\">Related topics</h2>\n<ul>\n<li><a href=\"?!=/styles/containers\">Containers and typography</a></li>\n<li><a href=\"?!=/styles/layout\">Layout and responsive grid</a></li>\n<li><a href=\"?!=/styles/surfaces\">Surfaces and gradients</a></li>\n<li><a href=\"?!=/styles/motion\">Motion and scroll reveal</a></li>\n<li><a href=\"?!=/fundamentals/rendering\">Rendering and VNodes</a></li>\n</ul>\n",
  "headings": [
    {
      "id": "try-the-website",
      "title": "Try the website"
    },
    {
      "id": "how-it-is-built",
      "title": "How it is built"
    },
    {
      "id": "related-topics",
      "title": "Related topics"
    }
  ],
  "demos": [
    {
      "id": "forma-website",
      "module": "./content/styles/websites.md.ts",
      "source": "mountForma(document.body);",
      "code": "mountForma(document.body);",
      "sourceHtml": "<pre class=\"shiki shiki-themes github-light github-dark\" style=\"background-color:#fff;--shiki-dark-bg:#24292e;color:#24292e;--shiki-dark:#e1e4e8\" tabindex=\"0\"><code><span class=\"line\"><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">mountForma</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(document.body);</span></span></code></pre>",
      "mode": "preview",
      "height": "800px"
    }
  ]
};
