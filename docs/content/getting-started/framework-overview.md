---
id: framework-overview
title: Elements and components
group: fundamentals
path: /getting-started/framework-overview
order: 10
description: Choose native elements or owned components and compose them with e() and c().
prev: /getting-started/quick-start
toc: true
api:
  - Component
  - cdiv
  - cbutton
  - e
  - ObservableValue
  - ObservableEvent
  - ElgoraUI
keywords:
  - framework
  - observable
  - event
  - theme
  - ui styles
  - css variables
sectionRedirects:
  - api-reference|/getting-started/framework-overview#related-topics
  - see-also|/getting-started/framework-overview#related-topics
  - ui-styles|/styles/overview#ui-styles
  - the-elg-base-class|/styles/overview#the-elg-base-class
  - color-system|/styles/overview#color-system
  - css-utilities|/styles/overview#css-utilities
  - component-classes-box-btn-and-future-additions|/styles/overview#component-classes-box-btn-and-future-additions
  - reactive-values-and-events|/fundamentals/state-and-events#reactive-values-and-events
  - binding-observable-state-to-the-dom|/fundamentals/state-and-events#binding-observable-state-to-the-dom
---

# Elements and components

## Overview

ElgoraUI is a browser-native framework for building self-contained web apps. Its foundation is a small set of composable components, native DOM elements, observable state, explicit events, and a token-based UI style system.

The examples on this page are live and editable. They use plain JavaScript and run directly in the browser, so the code you learn here is also the code you can use in an ordinary HTTP-served application. The playground exposes the common ElgoraUI factories directly, so one-off elements can be composed without an `Elgora.` prefix.

## Elements and components

Use `e()` when you need a native DOM element. Use a `Component` or a `c*` factory when the element should have component state, lifecycle, rendering, or bindings.

<live-demo id="framework-composition" src="framework-overview.md.composition.ts"></live-demo>

The `c*` factories create `Component` instances, while `e()` creates native elements when a component lifecycle is not needed. Both accept normal DOM properties and children. A component can be mounted into any ordinary DOM element; no application-wide runtime object or template compiler is required.

## Related topics

- [State, events and bindings](?!=/fundamentals/state-and-events)
- [Rendering and VNodes](?!=/fundamentals/rendering)
- [Lifecycle and resource ownership](?!=/components)
- [UI styles and utilities](?!=/styles/overview)
