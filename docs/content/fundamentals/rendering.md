---
id: rendering
title: Rendering and VNodes
path: /fundamentals/rendering
group: fundamentals
order: 30
description: Batch rendering through the UI scheduler and patch keyed virtual nodes without replacing stable DOM.
api:
  - Component
  - v
  - ElgoraUI
keywords:
  - patch
  - scheduler
  - virtual DOM
  - key
---

# Rendering and VNodes

Use native elements for static structure, bindings for small observable projections, and VNodes when a changing subtree is easier to describe declaratively. You do not need to rebuild a complete screen for every state change.

## Schedule a small rendering task

Component.render schedules work through the Elgora UI scheduler. Repeated requests for the same task can be coalesced within a frame. Keep the task function stable instead of allocating a new closure for every update. Component.renderOnChange subscribes to an ObservableValue and registers cleanup with its owner.

For a single text, property, attribute or style, prefer the [binding methods](?!=/fundamentals/state-and-events#binding-observable-state-to-the-dom). They already participate in scheduled rendering and release their subscriptions on disposal.

## Describe changing content with VNodes

The v factory describes elements without creating a new live DOM tree on every call. Component rendering can patch that description into its owned content. Keys identify logical siblings across changes; use stable domain IDs, not array positions when the list can reorder.

```ts
import { cdiv, v, setElementProps } from "elgora-ui";

const list = cdiv({});
const items = list.observable([{ id: "first", name: "First item" }]);
list.renderOnChange(items, () => {
    setElementProps(list.dom, {
        vnodes: items.Value.map(item => v("p", { key: item.id }, item.name))
    });
});
list.mount(container);
// Replace the observable value when data changes; keys preserve sibling identity.
items.Value = [{ id: "second", name: "New item" }, ...items.Value];
// Later: list.dispose() releases the subscription and its DOM.
```

DataGrid.renderCell accepts a VNode: the grid owns the cell wrapper and patches the returned content. See [custom rendering](?!=/components/datagrid/custom-cell-rendering) for a working example. [Calendar](?!=/components/calendar) and [Forma](?!=/styles/websites) demonstrate larger stateful components.

## Ownership and patching boundaries

Do not imperatively replace children that a VNode renderer owns. Likewise, avoid controlling the same class through both declarative props and a binding. Props combine class, className and ui, and remove only obsolete declarative classes while retaining unrelated classes.

Scheduling batches UI work, not business transactions. Await data operations explicitly; use [DataSet transactions](?!=/data/dataset/rules) when changes must succeed or roll back together. Measure layout after the relevant render has run, rather than assuming a scheduled update is synchronous.

## Related topics and API

- [State, events and bindings](?!=/fundamentals/state-and-events)
- [Lifecycle and resource ownership](?!=/components)
- [Component](?!=/api-reference/Component), [v](?!=/api-reference/v), [ElgoraUI](?!=/api-reference/ElgoraUI)
