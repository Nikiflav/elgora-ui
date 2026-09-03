export default {
  "id": "scroll-engine",
  "title": "Scroll Engine",
  "path": "/components/scroll-engine",
  "group": "components",
  "order": 60,
  "description": "Scroll virtual dimensions through a bounded viewport with programmatic and pointer input.",
  "toc": true,
  "api": [
    "ScrollEngine"
  ],
  "keywords": [
    "scroll engine",
    "scrolling",
    "virtual dimensions",
    "custom scrollbar"
  ],
  "html": "<h1>Scroll Engine</h1>\n<p><code>ScrollEngine</code> enhances an existing viewport with virtual dimensions and\ncustom scrolling. It keeps the physical viewport small even when the logical\ncontent is very large, and exposes coordinates and scroll events to the host\napplication.</p>\n<h2>Programmatic scrolling</h2>\n<p>Create the viewport first, then pass it to <code>ScrollEngine</code>. Call\n<code>updateDimensions()</code> with the logical content size and use <code>scrollTo()</code> when\napplication code needs to change the position.</p>\n<div data-live-demo=\"scroll-engine-basic\"></div>The same engine also handles wheel, keyboard, pointer, and touch input. Use\n`onScroll()` to update dependent UI and `onResize()` to recalculate layout.\n<p>See the <a href=\"?!=/api-reference/ScrollEngine\"><code>ScrollEngine</code> API reference</a>.</p>\n",
  "demos": [
    {
      "id": "scroll-engine-basic",
      "module": "./content/components/scroll-engine.md.ts",
      "source": "const viewport = e(\"div\", {\n    ui: [\"elg\", \"border\", \"w-100\"],\n    style: { height: \"240px\" }\n});\nconst content = e(\"div\", {\n    ui: [\"elg\", \"p-3\"],\n    style: {\n        width: \"1000px\",\n        height: \"700px\",\n        background: \"linear-gradient(135deg, var(--elg-primary-bg), var(--elg-surface-color-3))\"\n    }\n}, e(\"h2\", \"Virtual scroll area\"), e(\"p\", \"Use the wheel, keyboard, or custom scrollbar to explore the content.\"), e(\"p\", { style: { marginTop: \"520px\" } }, \"You reached the lower part of the virtual content.\"), e(\"p\", \"The engine reports virtual coordinates through scrollTop and scrollLeft.\"));\nviewport.append(content);\ndocument.body.append(viewport);\nconst scroller = new ScrollEngine(viewport);\nscroller.updateDimensions(1000, 700);\nscroller.onScroll(() => {\n    content.style.transform = `translate(-${scroller.scrollLeft}px, -${scroller.scrollTop}px)`;\n});",
      "code": "const viewport = e(\"div\", {\n    ui: [\"elg\", \"border\", \"w-100\"],\n    style: { height: \"240px\" }\n});\nconst content = e(\"div\", {\n    ui: [\"elg\", \"p-3\"],\n    style: {\n        width: \"1000px\",\n        height: \"700px\",\n        background: \"linear-gradient(135deg, var(--elg-primary-bg), var(--elg-surface-color-3))\"\n    }\n}, e(\"h2\", \"Virtual scroll area\"), e(\"p\", \"Use the wheel, keyboard, or custom scrollbar to explore the content.\"), e(\"p\", { style: { marginTop: \"520px\" } }, \"You reached the lower part of the virtual content.\"), e(\"p\", \"The engine reports virtual coordinates through scrollTop and scrollLeft.\"));\nviewport.append(content);\ndocument.body.append(viewport);\nconst scroller = new ScrollEngine(viewport);\nscroller.updateDimensions(1000, 700);\nscroller.onScroll(() => {\n    content.style.transform = `translate(-${scroller.scrollLeft}px, -${scroller.scrollTop}px)`;\n});",
      "height": "300px"
    }
  ]
};
