---
id: components-overview
title: Component overview
group: components
path: /components
order: 10
description: Learn what an ElgoraUI Component adds to a native HTMLElement.
toc: true
keywords:
  - component
  - HTMLElement
  - lifecycle
  - composition
  - observable
---

# Component overview

`Component` is ElgoraUI's small, composable abstraction over a native
`HTMLElement`. It keeps the browser DOM as the actual rendering target, while
adding the structure and behavior needed to build larger web applications.

## Component and HTMLElement

An `HTMLElement` gives you a browser node: attributes, properties, events, and
children. A `Component` owns an `HTMLElement` through its `dom` property and
adds a consistent component boundary around it.

The most important additions are:

- **Composition** — `children` and `append()` accept text, numbers, native
  nodes, other Components, and nested arrays.
- **Lifecycle** — `comcreate`, `commount`, `comunmount`, and `comdispose` let a
  component initialize, connect, disconnect, and release resources.
- **State** — a component can keep local state and create observable values
  through `com.observable()`.
- **Reactive rendering** — `renderOnChange()` reruns a small rendering action
  when an `ObservableValue` changes.
- **Bindings** — properties, attributes, styles, classes, and UI styles can be
  connected to observable values with `bindProperty()`, `bindAttribute()`,
  `bindStyle()`, `bindClass()`, and `bindUiStyle()`.
- **Safe mounting** — `mount()`, `unmount()`, `dispose()`, and `lock()` provide
  predictable ownership of the DOM tree.

The component's `dom` remains a normal `HTMLElement`, so native browser APIs
can still be used when needed. Use the Component API for changes to the
component tree so lifecycle behavior stays consistent.

## Component lifecycle

A component has three distinct lifecycle phases. The phase determines whether
the component is connected to the document and which resources it should own.

### Create

The constructor creates the component's `dom`, applies its options, appends its
initial children, and invokes `comcreate` once. Use this phase for component-
owned DOM setup and state initialization. A component does not have to be
mounted yet, so code in this phase should not assume that `dom.isConnected` is
true.

### Mount and unmount

`mount(container)` connects the component to an `HTMLElement` or CSS selector.
It invokes lifecycle callbacks for the complete component subtree in
parent-to-child order:

1. `commount` option callback;
2. protected `onMount()` hook;
3. the same sequence for each child component.

`unmount()` removes the component from its parent without destroying it. The
component remains in memory, keeps its state, and can be mounted again. Its
callbacks run in the reverse order, children first and parent last.

The callbacks are not copied from a parent to its children. Every component
receives its own lifecycle callbacks when the component tree is traversed.

Use `onMount()` and `onUnmount()` for resources that depend on an external
mount context, such as a listener on `window`, `document`, or the host element.
Pair every subscription created in `onMount()` with its removal in
`onUnmount()` so repeated mount/unmount cycles do not create duplicate
listeners. Subscriptions to the component's own `dom` can be created during
creation and remain available while the component is detached.

Always call `mount()` and `unmount()` instead of directly appending or removing
`dom`; direct DOM operations bypass lifecycle callbacks for the component and
its descendants.

### Dispose

`dispose()` is the permanent end of the component lifecycle. It unmounts the
component, disposes its child components, releases registered resources, and
invokes `comdispose`. A disposed component cannot be mounted again. Use
`dispose()` for resources owned for the entire lifetime of the component, while
`onUnmount()` is for resources that only belong to one mounted instance.

## Creating a component

The following example models a small status panel in an application shell. It
keeps its own state, listens to the external `window` object only while it is
mounted, and can be unmounted and mounted again without losing that state.

<live-demo id="component-create" demo="create-component"></live-demo>

The essential shape is:

```js
class StatusPanel extends Component {
  constructor() {
    super({ tag: "section" });
    this.status = e("p", "Waiting for mount");
    this.append(this.status);
  }

  onMount() {
    this.updateStatus();
    window.addEventListener("resize", this.updateStatus);
  }

  onUnmount() {
    window.removeEventListener("resize", this.updateStatus);
  }

  updateStatus = () => {
    this.status.textContent = `Mounted at ${window.innerWidth}px wide`;
  };
}

const panel = new StatusPanel();
panel.mount(document.body);
```

For one-off DOM nodes, use `e()` directly. When a piece of UI owns state,
lifecycle, or reusable behavior, use `Component` or one of the component
factories such as [`cbutton()`](?!=/api-reference/cbutton).

## Composition with `e()` and component factories

`e()` creates native elements and accepts nested children. Component factories
such as `cbutton()` return Components, so both forms can be composed in the
same tree:

```js
return [
  e("p", "Choose an action:"),
  cbutton({ children: "Continue" })
];
```

The complete API is available in the [`Component` API reference](?!=/api-reference/Component),
including [`ComponentOptions`](?!=/api-reference/ComponentOptions),
[`ComponentChild`](?!=/api-reference/ComponentChild), [`e()`](?!=/api-reference/e),
and the component factories.

## UI Styles

Components can use the ElgoraUI `ui` property to apply semantic styles and
utility classes. UI Styles are documented separately, including the
[semantic color system](?!=/styles/semantic-colors) and
[HTML elements and utilities](?!=/styles/html-elements).
