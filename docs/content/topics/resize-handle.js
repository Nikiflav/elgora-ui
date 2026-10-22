export default {
  "id": "resize-handle",
  "title": "Resizable elements — ResizeHandle",
  "path": "/components/resize-handle",
  "group": "components",
  "parent": "menus",
  "order": 33,
  "description": "Add a reusable pointer resize grip, minimum dimensions and viewport constraints.",
  "prev": "/tooltip",
  "next": "/components/browser-router",
  "toc": true,
  "api": [
    "ResizeHandle",
    "ResizeHandleOptions"
  ],
  "keywords": [],
  "sectionRedirects": [],
  "html": "<h1>Resizable elements — ResizeHandle</h1>\n<p>ResizeHandle adds resizing to a positioned element without owning its content. Try dragging the corner of the <a href=\"?!=/popover\">Popover demo</a>.</p>\n<h2 id=\"configure-a-resize-handle\">Configure a resize handle</h2>\n<p>The demo also uses <a href=\"?!=/api-reference/ResizeHandle\">ResizeHandle</a> to resize the panel\nfrom its bottom-right corner. It captures the pointer, constrains dimensions to\nthe viewport and retains inline dimensions when the panel is reopened.</p>\n<pre class=\"shiki shiki-themes github-light github-dark\" style=\"background-color:#fff;--shiki-dark-bg:#24292e;color:#24292e;--shiki-dark:#e1e4e8\" tabindex=\"0\"><code><span class=\"line\"><span style=\"color:#D73A49;--shiki-dark:#F97583\">const</span><span style=\"color:#005CC5;--shiki-dark:#79B8FF\"> grip</span><span style=\"color:#D73A49;--shiki-dark:#F97583\"> =</span><span style=\"color:#D73A49;--shiki-dark:#F97583\"> new</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\"> ResizeHandle</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">({</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">    target: popover.dom, minWidth: </span><span style=\"color:#005CC5;--shiki-dark:#79B8FF\">200</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, minHeight: </span><span style=\"color:#005CC5;--shiki-dark:#79B8FF\">100</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">,</span></span>\n<span class=\"line\"><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">    onResize</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">: </span><span style=\"color:#E36209;--shiki-dark:#FFAB70\">size</span><span style=\"color:#D73A49;--shiki-dark:#F97583\"> =></span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\"> console.</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">log</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(size.width, size.height)</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">});</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">popover.</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">addCleanup</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(grip);</span></span>\n<span class=\"line\"></span></code></pre>\n<p>The helper changes border-box dimensions, not panel positioning. Use a positioned\ntarget with flexible content; dispose the helper with its owner.</p>\n<h2 id=\"ownership\">Ownership</h2>\n<p>Register the helper with its owner through addCleanup. Dispose it before removing an independently managed target. Resizing changes inline dimensions, not application data or the target’s placement policy.</p>\n<p>API: <a href=\"?!=/api-reference/ResizeHandle\">ResizeHandle</a>, <a href=\"?!=/api-reference/ResizeHandleOptions\">ResizeHandleOptions</a>.</p>\n",
  "headings": [
    {
      "id": "configure-a-resize-handle",
      "title": "Configure a resize handle"
    },
    {
      "id": "ownership",
      "title": "Ownership"
    }
  ],
  "demos": []
};
