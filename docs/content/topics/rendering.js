export default {
  "id": "rendering",
  "title": "Rendering and VNodes",
  "path": "/fundamentals/rendering",
  "group": "fundamentals",
  "order": 30,
  "description": "Batch rendering through the UI scheduler and patch keyed virtual nodes without replacing stable DOM.",
  "prev": "/fundamentals/state-and-events",
  "next": "/components",
  "toc": true,
  "api": [
    "Component",
    "v",
    "ElgoraUI"
  ],
  "keywords": [
    "patch",
    "scheduler",
    "virtual DOM",
    "key"
  ],
  "sectionRedirects": [],
  "html": "<h1>Rendering and VNodes</h1>\n<p>Use native elements for static structure, bindings for small observable projections, and VNodes when a changing subtree is easier to describe declaratively. You do not need to rebuild a complete screen for every state change.</p>\n<h2 id=\"schedule-a-small-rendering-task\">Schedule a small rendering task</h2>\n<p>Component.render schedules work through the Elgora UI scheduler. Repeated requests for the same task can be coalesced within a frame. Keep the task function stable instead of allocating a new closure for every update. Component.renderOnChange subscribes to an ObservableValue and registers cleanup with its owner.</p>\n<p>For a single text, property, attribute or style, prefer the <a href=\"?!=/fundamentals/state-and-events#binding-observable-state-to-the-dom\">binding methods</a>. They already participate in scheduled rendering and release their subscriptions on disposal.</p>\n<h2 id=\"describe-changing-content-with-vnodes\">Describe changing content with VNodes</h2>\n<p>The v factory describes elements without creating a new live DOM tree on every call. Component rendering can patch that description into its owned content. Keys identify logical siblings across changes; use stable domain IDs, not array positions when the list can reorder.</p>\n<pre class=\"shiki shiki-themes github-light github-dark\" style=\"background-color:#fff;--shiki-dark-bg:#24292e;color:#24292e;--shiki-dark:#e1e4e8\" tabindex=\"0\"><code><span class=\"line\"><span style=\"color:#D73A49;--shiki-dark:#F97583\">import</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\"> { cdiv, v, setElementProps } </span><span style=\"color:#D73A49;--shiki-dark:#F97583\">from</span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\"> \"elgora-ui\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">;</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#D73A49;--shiki-dark:#F97583\">const</span><span style=\"color:#005CC5;--shiki-dark:#79B8FF\"> list</span><span style=\"color:#D73A49;--shiki-dark:#F97583\"> =</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\"> cdiv</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">({});</span></span>\n<span class=\"line\"><span style=\"color:#D73A49;--shiki-dark:#F97583\">const</span><span style=\"color:#005CC5;--shiki-dark:#79B8FF\"> items</span><span style=\"color:#D73A49;--shiki-dark:#F97583\"> =</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\"> list.</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">observable</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">([{ id: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"first\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, name: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"First item\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\"> }]);</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">list.</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">renderOnChange</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(items, () </span><span style=\"color:#D73A49;--shiki-dark:#F97583\">=></span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">    setElementProps</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(list.dom, {</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">        vnodes: items.Value.</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">map</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(</span><span style=\"color:#E36209;--shiki-dark:#FFAB70\">item</span><span style=\"color:#D73A49;--shiki-dark:#F97583\"> =></span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\"> v</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(</span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"p\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, { key: item.id }, item.name))</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">    });</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">});</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">list.</span><span style=\"color:#6F42C1;--shiki-dark:#B392F0\">mount</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">(container);</span></span>\n<span class=\"line\"><span style=\"color:#6A737D;--shiki-dark:#6A737D\">// Replace the observable value when data changes; keys preserve sibling identity.</span></span>\n<span class=\"line\"><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">items.Value </span><span style=\"color:#D73A49;--shiki-dark:#F97583\">=</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\"> [{ id: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"second\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">, name: </span><span style=\"color:#032F62;--shiki-dark:#9ECBFF\">\"New item\"</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\"> }, </span><span style=\"color:#D73A49;--shiki-dark:#F97583\">...</span><span style=\"color:#24292E;--shiki-dark:#E1E4E8\">items.Value];</span></span>\n<span class=\"line\"><span style=\"color:#6A737D;--shiki-dark:#6A737D\">// Later: list.dispose() releases the subscription and its DOM.</span></span>\n<span class=\"line\"></span></code></pre>\n<p>DataGrid.renderCell accepts a VNode: the grid owns the cell wrapper and patches the returned content. See <a href=\"?!=/components/datagrid/custom-cell-rendering\">custom rendering</a> for a working example. <a href=\"?!=/components/date-picker\">DatePicker</a> and <a href=\"?!=/styles/websites\">Forma</a> demonstrate larger stateful components.</p>\n<h2 id=\"ownership-and-patching-boundaries\">Ownership and patching boundaries</h2>\n<p>Do not imperatively replace children that a VNode renderer owns. Likewise, avoid controlling the same class through both declarative props and a binding. Props combine class, className and ui, and remove only obsolete declarative classes while retaining unrelated classes.</p>\n<p>Scheduling batches UI work, not business transactions. Await data operations explicitly; use <a href=\"?!=/data/dataset/rules\">DataSet transactions</a> when changes must succeed or roll back together. Measure layout after the relevant render has run, rather than assuming a scheduled update is synchronous.</p>\n<h2 id=\"related-topics-and-api\">Related topics and API</h2>\n<ul>\n<li><a href=\"?!=/fundamentals/state-and-events\">State, events and bindings</a></li>\n<li><a href=\"?!=/components\">Lifecycle and resource ownership</a></li>\n<li><a href=\"?!=/api-reference/Component\">Component</a>, <a href=\"?!=/api-reference/v\">v</a>, <a href=\"?!=/api-reference/ElgoraUI\">ElgoraUI</a></li>\n</ul>\n",
  "headings": [
    {
      "id": "schedule-a-small-rendering-task",
      "title": "Schedule a small rendering task"
    },
    {
      "id": "describe-changing-content-with-vnodes",
      "title": "Describe changing content with VNodes"
    },
    {
      "id": "ownership-and-patching-boundaries",
      "title": "Ownership and patching boundaries"
    },
    {
      "id": "related-topics-and-api",
      "title": "Related topics and API"
    }
  ],
  "demos": []
};
