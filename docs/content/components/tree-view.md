---
id: tree-view
title: TreeView
group: components
parent: navigation
path: /components/tree-view
order: 53
description: Virtualized trees with lazy synchronous or asynchronous children, caching and keyboard navigation.
toc: true
api:
  - TreeView
  - TreeViewOptions
  - TreeDataAdapter
  - TreeItemRenderContext
keywords:
  - tree
  - asynchronous
  - hierarchy
  - lazy loading
---

# TreeView

Use `TreeView<T>` for navigation, document outlines and hierarchical pickers.
It is a standalone component built on `VirtualList`, not a one-column DataGrid.
Only visible rows are rendered; expanded items and loaded children remain in memory.

## Lazy asynchronous branches

Expand **Pages** and **Media** to load their children. **Retry example** deliberately
fails once: its inline Retry button reloads only that branch. The request counter
also demonstrates that collapsing and reopening a successful branch uses its cache.
Use **Show nested example** to open Pages → Guides → Getting started → Tutorials.
Mixed folders and leaves across five levels demonstrate indentation and reserved
disclosure space; a long title also exercises single-line truncation.
The custom renderer adds open/closed folder icons and page/image icons without
changing the accessible labels or TreeView's disclosure controls.

<live-demo id="tree-view-overview" height="430px" src="tree-view.md.ts"></live-demo>

## Data adapter

```ts
const tree = new TreeView<FileItem>({
    label: "Files",
    getText: item => item.name,
    data: {
        getKey: item => item.id,
        hasChildren: item => item.isFolder,
        getChildren: (item, signal) => loadChildren(item?.id, signal)
    }
});
tree.dom.style.height = "300px";
tree.mount(container);
```

`getChildren(undefined, signal)` requests roots. Every call returns **all immediate
children**, either as an array or a Promise. Pagination is not part of this contract.
Keys must be globally unique, stable strings, including across different parents.
`hasChildren` must be available before loading a branch; a successfully loaded empty
branch loses its disclosure arrow.

Loading and error rows belong to their branch and do not replace the rest of the
tree. Concurrent requests for the same branch are shared. Collapsing retains both
cached children and in-flight work; reopening does not start a duplicate request.

## Cache and lifetime

Mounting starts root loading. `load()` can also start it explicitly and shares the
existing request. `expand(item)` loads a known item's children when needed;
`collapse(item)` hides descendants without discarding them.

`await tree.refresh(item)` invalidates and reloads a branch's descendants;
`await tree.refresh()` reloads the whole tree. Stable keys retain expansion and
selection when their items are loaded again. A missing selected item clears the
selection after loading finishes. Refresh aborts invalidated requests. Dispose
aborts all requests, and late responses are ignored even if a loader ignores its signal.

Loader failures are shown locally rather than rejected from `load`, `expand` or
`refresh`. Do not use their Promise fulfillment as proof that a remote request succeeded.
TreeView does not infer external data changes: call `refresh` when the adapter changes.

## Focus, selection and activation

Focus and selection are independent. Arrow Up/Down and Home/End move focus;
Right opens a branch or enters its first child, and Left collapses it or moves
to its parent. Typing a label prefix finds a visible item. Space selects;
Enter selects and activates. Clicking selects; double-clicking activates.

Subscribe to `selectionChanged`, `focusedItemChanged` and `itemActivated` for
these separate actions. `itemContextMenu` lets the host provide its own menu.
The tree exposes ARIA levels, sibling positions, expansion and selection state.

`select(item)` selects a loaded item without moving browser focus.
`await reveal(item)` opens its known ancestors and scrolls to it, also without
stealing browser focus. It returns false for an unknown item: a remote adapter must
load its ancestor path first. There is no automatic remote path search.

## Custom rows

`renderItem` can populate the row's content host with an icon, tag and secondary
text. Keep content non-interactive: TreeView owns disclosure, keyboard focus and
selection. Always provide `getText` for the accessible label and type-ahead.
This version uses fixed 30px, single-line rows; custom content must fit that height.

The [HtmlEditor demo](?!=/components/html-editor) also uses TreeView to navigate
the editor's model elements. Structural element selection and the full property
inspector are separate, later stages.
