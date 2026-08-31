# ElgoraUI documentation and framework development plan

## 1. Purpose and product direction

ElgoraUI started as a collection of components created for real CMS and ERP
applications. The original implementations used Mithril.js and Bootstrap, but
the reusable components should not require either of them.

The long-term product should therefore be presented as:

> A framework-independent UI toolkit for self-contained business web
> applications, built on native DOM elements, reactive state, themeable UI
> styles, and rich components.

`DataGrid` is the first major proof of this direction, not the complete
identity of the framework. The same foundation should support components such
as `Calendar`, `Tree`, `VirtualList`, schedulers, forms, and other business UI
components.

The implementation plan has two parallel goals:

1. make the documentation the official guide and live product showcase;
2. make the framework contracts stable enough for future framework adapters,
   including React, Vue, and other popular systems.

## 2. Current foundation

The following parts already exist and should be preserved as the base:

- Markdown topics under `docs/content` with YAML frontmatter;
- topic-local demo files following the `<topic>.md.<demo>.ts` convention;
- build-time validation and TypeScript-to-JavaScript compilation of demos;
- browser demos running in an isolated iframe and receiving only JavaScript;
- lazy loading of Markdown topic modules through the generated manifest;
- generated API documentation from TypeScript/JSDoc;
- API entries grouped by namespace and linked from topics;
- `e()`, `c()`, `cdiv()`, `cbutton()` and `Component` as the composition base;
- `ObservableValue`, `ObservableEvent`, property/attribute/style/class
  bindings, and the render scheduler;
- semantic CSS tokens, utility classes, `ui: []`, and theme support;
- rich components such as `DataGrid`, `VirtualList`, `Popover`, `PopupMenu`,
  `Tooltip`, `BrowserRouter`, and `ScrollEngine`.

The next work should complete and clarify these contracts rather than create a
second parallel architecture.

## 3. Documentation architecture

### 3.1 Information architecture

The docs navigation should use two clearly different areas:

```text
Guide
  Getting started
  Framework fundamentals
  Styles
  Components
    Component overview
    DataGrid
      Overview
      Tree data
      Columns
      Sorting
      Filtering
      Grouping
    Virtual List
    Browser Router
    Scroll Engine

API Reference
  Core
  Components
    DataGrid
    Browser Router
    Scrollbar
  Data
  Styles
```

Guide topics explain concepts and usage. API Reference pages describe the
complete public contract. A guide topic should not duplicate the full API
reference inline.

### 3.2 New introduction and overview

Replace the current generic overview with a product-oriented introduction:

1. What ElgoraUI is and which problem it solves.
2. Why it is independent from Mithril, React, Vue, and Bootstrap.
3. The native DOM foundation and the `e()`/`c()` composition model.
4. Reactive state through `ObservableValue` and `ObservableEvent`.
5. The token-based UI style and theme system.
6. Rich business components, beginning with `DataGrid`.
7. The future adapter model for React, Vue, and other frameworks.
8. A small runnable example using `document.body`.
9. Links to the first learning path and the main component topics.

The first screen should answer three questions quickly:

- What is ElgoraUI?
- Why would I use it instead of a rendering framework plus a CSS library?
- What can I build with it?

### 3.3 Standard topic template

Every guide topic should follow this structure where applicable:

```text
Overview
Basic usage
Live demo
How it works
Common scenarios
Advanced features
Customization and accessibility
Related topics
API Reference
Next topic
```

The first demo should be the simplest useful example. Advanced demos should be
separate sections or child topics, especially for DataGrid.

### 3.4 Topic metadata

Extend the topic metadata only when a real navigation or rendering need exists.
The useful additions are:

- `parent` and `order` for nested navigation;
- `prev` and `next` for guided reading;
- `keywords` for documentation search;
- `api` for related API entries;
- `related` for links to other guide topics;
- demo metadata such as `id`, `mode`, `height`, and source file;
- optional `status` for draft/experimental components.

The generated manifest remains the single source of truth for topic discovery.

### 3.5 Demo convention

Each editable or read-only demo should be a valid standalone TypeScript file:

```ts
import { e } from "../../../src/core/e";

export default function demo(): void {
  const element = e("div", "Example");
  element.mount(document.body);
}
```

The build should continue to:

- type-check the source file independently;
- extract the function body for the browser sandbox;
- compile it to JavaScript;
- inject the Elgora runtime symbols into the demo context;
- keep the original TypeScript only in the repository, never in the browser.

Read-only and editable demos should share the same source/build pipeline. The
only difference is the presentation control in the docs UI.

Add later:

- syntax highlighting for the displayed JavaScript;
- copy-to-clipboard;
- reset/run controls for editable examples;
- clear error output with source location;
- optional demo test fixtures for components that require deterministic data.

## 4. API Reference plan

### 4.1 JSDoc as the source of truth

Public classes, functions, types, properties, methods, and events should be
documented in the source files. The generator should expose:

- signature;
- description;
- parameters and default values;
- return type and description;
- thrown errors where relevant;
- lifecycle behavior;
- events and callback contracts;
- examples or links to guide topics.

Use a compact topic tag for reverse links:

```ts
/**
 * Mounts the component into a DOM container.
 * @topic components/component-overview
 */
```

The generator should normalize the topic value and resolve it against the
topic manifest. Invalid topic references should fail the docs build.

### 4.2 Topic-to-API and API-to-topic links

Guide topics link to API entries through frontmatter or explicit links:

```yaml
api:
  - DataGrid
  - DataGridOptions
```

API entries should expose a “Related topics” section generated from `@topic`.
This gives the documentation a reliable two-way navigation path:

```text
Guide topic -> API class/type/member
API class/type/member -> conceptual guide topic and demos
```

### 4.3 Namespace grouping

Namespaces should be derived from the public source structure and explicit
metadata, not only from display names. The target grouping is:

- `Core` for DOM helpers, components, observables, and scheduling;
- `Components` for UI components;
- `Data` for data sources, filters, and data contracts;
- `Styles` for UI style types and theme contracts.

Folder structure may provide the default namespace, while an explicit JSDoc
tag should be able to override it when a type belongs to a shared public
concept.

### 4.4 API page quality

Improve API pages with:

- separate Properties, Methods, and Events sections;
- compact parameter blocks for methods;
- readable signatures with method parameters kept adjacent to parentheses;
- links for referenced public types;
- source file links;
- related guide topics;
- an API overview/cheatsheet for the most common members.

## 5. Framework and component contracts

### 5.1 Component lifecycle

Make the component lifecycle explicit and consistent for all future components:

```ts
component.mount(container);
component.unmount();
component.destroy();
```

Verify and document:

- whether `mount()` accepts `HTMLElement`, selector, or both;
- whether mounting replaces or appends content;
- whether repeated mounting is supported;
- what happens to subscriptions and event listeners on unmount/destroy;
- how a component exposes its root DOM element;
- how asynchronous initialization and failure are reported.

Introduce an internal cleanup registry if needed so components can register
subscriptions, event listeners, observers, timers, and child components and
dispose them predictably.

### 5.2 Reactive model

Consolidate all reactivity around the existing observable concepts:

- `ObservableValue<T>` for state with a current value;
- `ObservableEvent<T>` for notifications without current state;
- bindings for properties, attributes, styles, and `ui` classes;
- scheduler-backed updates;
- automatic disposal with the owning component.

Evaluate derived/computed observables only after the basic lifecycle and cleanup
behavior is stable. Avoid introducing a second state-management abstraction for
individual components.

### 5.3 Shared data contracts

Extract common contracts that can be reused by DataGrid, VirtualList, Tree,
Calendar, and future components:

- `DataSource<T>` and random-access data sources;
- loading, error, and empty states;
- selection and selection ranges;
- filtering and filter function registries;
- sorting and grouping definitions;
- row/item identity;
- rendering callbacks and custom cell/item renderers.

Document these contracts separately under `API Reference > Data` and link to
them from each component topic.

### 5.4 Composition and customization

Rich components should expose extension points instead of hardcoded UI:

- custom renderers;
- custom editors;
- custom headers and toolbars;
- custom empty/loading/error content;
- custom actions and context menus;
- custom styling through `ui` and semantic tokens.

DataGrid should be the first component used to validate these extension points.

### 5.5 Accessibility

Accessibility should be part of the component contract:

- keyboard navigation;
- focus management;
- ARIA roles and labels;
- selected/active state semantics;
- accessible menus, dialogs, grids, and form controls;
- reduced-motion behavior where animations are introduced.

Each component topic should include an Accessibility section when the
component has interactive behavior.

## 6. Styles and theme system

Keep CSS variables/tokens in the token files and reusable classes in the style
files. Continue using `ui: []` in documentation and examples.

Complete the style system in this order:

1. document token roles and the `elg` opt-in class;
2. document semantic `bg`, `text`, and `border` roles;
3. document surfaces, typography, spacing, layout, borders, radius, shadows,
   cursor, and text-decoration utilities;
4. document component classes such as `btn`, `box`, `field`, and tables;
5. define the theme override contract;
6. provide a theme creation example and theme switching example;
7. remove component-specific hardcoded colors where a semantic token exists.

Every new component should use semantic tokens instead of directly depending on
the current light or dark palette.

## 7. Framework integrations

Framework adapters should be a later layer, not a replacement for the core.
First document a stable adapter contract:

```text
framework component props
        -> ElgoraUI component options
        -> native DOM/component lifecycle
        -> framework cleanup
```

The first adapter can target React because it is widely used, but the core
must remain usable without any adapter. Adapters should wrap the existing
component and forward properties, events, slots/renderers, and lifecycle.

Do not duplicate DataGrid implementation per framework.

## 8. Build, testing, and release quality

Add build checks for:

- all Markdown frontmatter;
- all referenced demo files;
- standalone TypeScript demo type-checking;
- generated JavaScript demo compilation;
- unresolved topic links and `@topic` references;
- duplicate topic paths and API paths;
- missing API entries referenced by topics;
- namespace and sidebar tree consistency.

Add focused runtime tests for:

- mount/unmount/destroy and cleanup;
- observable bindings;
- router navigation and browser history;
- DataSource and selection contracts;
- keyboard and accessibility behavior;
- theme switching.

Every new component should ship with at least one guide topic, one runnable
basic demo, API documentation, and a small contract test.

## 9. Phased implementation

### Phase 1 — Documentation foundation

- Rewrite the home overview and introduction around the product direction.
- Remove stale legacy links and routes such as the deleted `Features/Core`
  topic.
- Finalize the Guide/API navigation model.
- Standardize topic frontmatter and demo conventions.
- Add a generated broken-link and metadata validation step.

**Done when:** a new developer can understand the purpose of ElgoraUI and
reach the first working component example without encountering legacy routes.

### Phase 2 — Topic migration

- Migrate remaining legacy component topics.
- Split DataGrid into overview and feature topics.
- Add BrowserRouter and ScrollEngine topics under Components.
- Move all demos next to their Markdown topic files.
- Ensure every demo uses the unified TypeScript-to-JavaScript pipeline.

**Done when:** no user-facing component depends on a legacy playground topic.

### Phase 3 — API Reference completion

- Audit public exports and missing JSDoc.
- Add parameter, return, event, and lifecycle descriptions.
- Implement `@topic` parsing and reverse links.
- Finalize namespace grouping and API cheatsheets.
- Add validation for unresolved API/topic references.

**Done when:** every public export has a discoverable API entry and every major
component has guide-to-API and API-to-guide links.

### Phase 4 — Component contract hardening

- Verify and standardize mount/unmount/destroy behavior.
- Add cleanup ownership for subscriptions and observers.
- Document and test the reactive binding model.
- Extract shared DataSource, selection, filtering, and rendering contracts.

**Done when:** a new component can follow one documented lifecycle and data
contract without inventing local conventions.

### Phase 5 — Styles and accessibility

- Complete semantic token documentation and theme creation guidance.
- Audit components for hardcoded colors and inconsistent states.
- Document and test keyboard/focus/ARIA behavior.
- Add style examples for common native and rich components.

**Done when:** light/dark themes and semantic styles work consistently across
the documentation demos and component suite.

### Phase 6 — Developer experience

- Add syntax highlighting.
- Improve editable demo errors and source locations.
- Add searchable API and topic navigation.
- Add copy links for headings and code examples.
- Add generated source links and version information.

**Done when:** the docs can be used as both a learning resource and a practical
reference while developing an application.

### Phase 7 — Framework adapters

- Define the adapter contract.
- Implement the first React adapter around existing components.
- Validate the same component through a vanilla DOM example and an adapter.
- Document adapter installation, lifecycle, events, and customization.

**Done when:** a component has one implementation and can be consumed from the
core DOM API and at least one popular framework.

## 10. Recommended immediate next steps

1. Rewrite the home overview and introduction.
2. Remove or redirect stale `/core` navigation references.
3. Add the topic metadata and broken-link validation needed by the new docs.
4. Continue migrating the remaining legacy component topics.
5. Audit JSDoc and implement `@topic` reverse links.
6. Only then begin framework adapters.

This order keeps the public story, documentation structure, and framework
contracts aligned while avoiding duplicate implementations and another legacy
playground layer.
