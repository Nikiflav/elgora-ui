---
id: state-and-events
title: State, events and bindings
group: fundamentals
path: /fundamentals/state-and-events
order: 20
description: Use observable state, explicit events and owned DOM bindings.
api:
  - ObservableValue
  - ObservableEvent
  - Component
---

# State, events and bindings

## Reactive values and events

Use `ObservableValue` for mutable state that should notify subscribers when its value changes. The current value is available through `.Value`.

<live-demo id="observable-value" src="../getting-started/framework-overview.md.observable-value.ts"></live-demo>

Use `ObservableEvent` for an explicit notification that does not hold a current value.

<live-demo id="observable-event" src="../getting-started/framework-overview.md.observable-event.ts"></live-demo>

### Binding observable state to the DOM

For direct projections of state, bind an observable to a property, attribute, style, or class. Bindings are refreshed through the ElgoraUI render scheduler and are disposed with the component.

<live-demo id="component-bindings" src="../getting-started/framework-overview.md.component-bindings.ts"></live-demo>

```js
component.bindProperty("disabled", loading);
component.bindAttribute("aria-label", count, value => `Count: ${value}`);
component.bindStyle("opacity", visible, value => value ? "1" : "0");
component.bindUiStyle("selected", isSelected);
component.bindUiStyle(["selected", "text-primary"], isSelected);
```

## Related topics and API

- [Rendering and VNodes](?!=/fundamentals/rendering) for larger changing subtrees.
- [Lifecycle and resource ownership](?!=/components) for subscription cleanup.
- [ObservableValue](?!=/api-reference/ObservableValue), [ObservableEvent](?!=/api-reference/ObservableEvent), [Component bindings](?!=/api-reference/Component).
