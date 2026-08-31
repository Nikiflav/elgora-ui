export default {
  "name": "Component",
  "kind": "class",
  "type": "Component",
  "description": "Base class for composable DOM components with lifecycle and observable state support.",
  "tags": [],
  "topics": [],
  "group": "core",
  "namespace": "Core",
  "path": "/api-reference/Component",
  "source": "src/core/Component.ts",
  "members": [
    {
      "name": "dom",
      "type": "HTMLElement",
      "description": "The native HTMLElement owned by this component.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "kind": "property"
    },
    {
      "name": "state",
      "type": "any",
      "description": "User state.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/core/Component.ts",
      "kind": "property"
    },
    {
      "name": "locked",
      "type": "boolean",
      "description": "Indicates whether the component is locked. When a component is locked, it cannot accept new children, and any attempt to append a child will result in an error. Locking a component is useful for preventing further modifications to the component's structure after it has been fully constructed and mounted. This ensures the integrity of the component tree and prevents unintended side effects from adding new children after the component is in use.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "kind": "property"
    },
    {
      "name": "lock",
      "type": "() => void",
      "description": "Locks the component, preventing further structure modifications.\n\nAfter locking, `append()` throws instead of adding children. Locking does\nnot affect rendering, mounting, unmounting, or disposal.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "append",
      "type": "(child: ComponentChild) => void",
      "description": "Appends a child or multiple children to this component. The child can be a string, number, DOM node, another Component instance, or an array of any of these types. When a Component instance is appended as a child, it will be automatically detached from its previous parent (if any) before being added to this component. This ensures that a Component can only have one parent at a time, maintaining the integrity of the component tree. If the child is null or undefined, this method will have no effect.\r\nIf the component is locked, an error will be thrown and the child will not be appended. Always use this method to add children to the component, as it ensures that the component tree remains consistent and that lifecycle events are properly handled. Do not directly manipulate the component's dom to add children, as this may lead to inconsistent state and missed lifecycle events.",
      "tags": [
        {
          "name": "param",
          "text": "child The child to append."
        },
        {
          "name": "returns",
          "text": "void"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "parameters": [
        {
          "name": "child",
          "type": "ComponentChild",
          "optional": false,
          "description": "The child to append."
        }
      ],
      "returns": {
        "type": "void",
        "description": "void"
      },
      "kind": "method",
      "signature": "(child: ComponentChild) => void"
    },
    {
      "name": "mount",
      "type": "(container: HTMLElement | string) => void",
      "description": "Appends the component DOM to the provided container.\n\nAlways use this method to attach a component to the document. It keeps the\ncomponent lifecycle state consistent and triggers mount lifecycle callbacks\nfor the complete component subtree. The current component is mounted first,\nfollowed by its descendants (parent-to-child order).\n\nA child component is discovered from the DOM tree and mounted automatically;\nlifecycle callbacks are not copied from the parent to the child. Each\ncomponent receives its own `commount` callback and `onMount()` call.\n\nIf the component is already mounted, it is first unmounted and then moved\nto the new container. The component instance and its state are preserved.",
      "tags": [
        {
          "name": "param",
          "text": "container The HTMLElement or CSS selector to which the component's\nDOM will be appended."
        },
        {
          "name": "example",
          "text": "const myComponent = new Component({ tag: \"div\", children: \"Hello, world!\" })\nmyComponent.mount(document.body) // Mounts the component and its descendants."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "parameters": [
        {
          "name": "container",
          "type": "string | HTMLElement",
          "optional": false,
          "description": "The HTMLElement or CSS selector to which the component's\nDOM will be appended."
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(container: HTMLElement | string) => void"
    },
    {
      "name": "unmount",
      "type": "() => void",
      "description": "Unmounts the component from the DOM without disposing the component.\n\nUnmount lifecycle callbacks are invoked for descendants first and then for\nthe current component (child-to-parent order). Each component receives its\nown `comunmount` callback and `onUnmount()` call; the callbacks are not\npropagated or shared between parent and child components.\n\nUse `onUnmount()` to release resources that depend on an external mount\ncontext, such as listeners on a host container, `window`, or `document`.\nResources owned by the component itself may remain available while it is\nunmounted. The component's state is preserved and it can be mounted again.\n\nAlways use this method instead of removing `dom` directly, otherwise\nlifecycle callbacks will not run and descendants can retain stale state.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "observable",
      "type": "<T>(value: T) => ObservableValue<T>",
      "description": "Create an observable value that is automatically disposed when the component is disposed. The returned ObservableValue can be used to create reactive components by subscribing to it or using it in renderOnChange(). When the component is disposed, all created observable values will be automatically disposed as well, preventing memory leaks and ensuring proper cleanup of resources.",
      "tags": [
        {
          "name": "param",
          "text": "value The initial value of the observable."
        },
        {
          "name": "returns",
          "text": "The created ObservableValue instance, which is automatically disposed when the component is disposed. The returned ObservableValue can be used to create reactive components by subscribing to it or using it in renderOnChange(). When the component is disposed, all created observable values will be automatically disposed as well, preventing memory leaks and ensuring proper cleanup of resources."
        },
        {
          "name": "example",
          "text": "const count = this.observable(0)"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "parameters": [
        {
          "name": "value",
          "type": "T",
          "optional": false,
          "description": "The initial value of the observable."
        }
      ],
      "returns": {
        "type": "ObservableValue<T>",
        "description": "The created ObservableValue instance, which is automatically disposed when the component is disposed. The returned ObservableValue can be used to create reactive components by subscribing to it or using it in renderOnChange(). When the component is disposed, all created observable values will be automatically disposed as well, preventing memory leaks and ensuring proper cleanup of resources."
      },
      "kind": "method",
      "signature": "<T>(value: T) => ObservableValue<T>"
    },
    {
      "name": "subscribe",
      "type": "<T>(obs: Observable<T>, callback: (v: T) => void) => void",
      "description": "Subscribe to an observable value. The callback will be called whenever the observable value changes, and also immediately with the current value upon subscription.",
      "tags": [
        {
          "name": "param",
          "text": "obs An observable to subscribe to."
        },
        {
          "name": "param",
          "text": "callback A function to be called whenever the observable value changes."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "parameters": [
        {
          "name": "obs",
          "type": "Observable<T>",
          "optional": false,
          "description": "An observable to subscribe to."
        },
        {
          "name": "callback",
          "type": "(v: T) => void",
          "optional": false,
          "description": "A function to be called whenever the observable value changes."
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "<T>(obs: Observable<T>, callback: (v: T) => void) => void"
    },
    {
      "name": "addCleanup",
      "type": "(cleanup: ComponentCleanup) => void",
      "description": "Registers a resource cleanup callback that runs when the component is\ndisposed. Use this for event listeners, observers, timers, and other\nresources that are not themselves Disposable objects.",
      "tags": [
        {
          "name": "param",
          "text": "cleanup A Disposable resource or a callback that releases it."
        },
        {
          "name": "example",
          "text": "component.addCleanup(() => window.removeEventListener(\"resize\", handler))"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "parameters": [
        {
          "name": "cleanup",
          "type": "ComponentCleanup",
          "optional": false,
          "description": "A Disposable resource or a callback that releases it."
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(cleanup: ComponentCleanup) => void"
    },
    {
      "name": "listen",
      "type": "(target: EventTarget, type: string, listener: EventListener, options?: boolean | AddEventListenerOptions) => void",
      "description": "Adds an event listener owned by the component. The listener is removed\nautomatically when the component is disposed. If the listener belongs to\nan external mount context, add and remove it explicitly in `onMount()` and\n`onUnmount()` instead; calling `listen()` repeatedly from `onMount()` would\notherwise register a new listener on every mount cycle.",
      "tags": [
        {
          "name": "param",
          "text": "target The EventTarget receiving the listener."
        },
        {
          "name": "param",
          "text": "type The event name."
        },
        {
          "name": "param",
          "text": "listener The event listener."
        },
        {
          "name": "param",
          "text": "options Native event listener options."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "parameters": [
        {
          "name": "target",
          "type": "EventTarget",
          "optional": false,
          "description": "The EventTarget receiving the listener."
        },
        {
          "name": "type",
          "type": "string",
          "optional": false,
          "description": "The event name."
        },
        {
          "name": "listener",
          "type": "EventListener",
          "optional": false,
          "description": "The event listener."
        },
        {
          "name": "options",
          "type": "boolean | AddEventListenerOptions | undefined",
          "optional": true,
          "description": "Native event listener options."
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(target: EventTarget, type: string, listener: EventListener, options?: boolean | AddEventListenerOptions) => void"
    },
    {
      "name": "observe",
      "type": "(observer: { disconnect(): void; }) => void",
      "description": "Registers an observer owned by the component. Its disconnect method is\ncalled automatically when the component is disposed. Observers that should\nexist only while the component is mounted should be created and disconnected\nin `onMount()` and `onUnmount()` instead.",
      "tags": [
        {
          "name": "param",
          "text": "observer An observer with a disconnect method, such as ResizeObserver."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "parameters": [
        {
          "name": "observer",
          "type": "{ disconnect(): void; }",
          "optional": false,
          "description": "An observer with a disconnect method, such as ResizeObserver."
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(observer: { disconnect(): void; }) => void"
    },
    {
      "name": "bindProperty",
      "type": "<T>(property: string, obs: Observable<T>, transform?: (value: T) => unknown) => void",
      "description": "Binds an observable value to a native DOM property.\n\nThe initial update is scheduled immediately for ObservableValue instances\nand then refreshed on the next animation frame after each observable update.\nThe subscription is disposed automatically with the component.",
      "tags": [
        {
          "name": "param",
          "text": "property The DOM property to assign, for example `textContent`,\n`value`, `disabled`, or `checked`."
        },
        {
          "name": "param",
          "text": "obs The observable source."
        },
        {
          "name": "param",
          "text": "transform Optional function that converts the source value to the\nproperty value."
        },
        {
          "name": "example",
          "text": "component.bindProperty(\"textContent\", count, value => `Count: ${value}`)"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "parameters": [
        {
          "name": "property",
          "type": "string",
          "optional": false,
          "description": "The DOM property to assign, for example `textContent`,\n`value`, `disabled`, or `checked`."
        },
        {
          "name": "obs",
          "type": "Observable<T>",
          "optional": false,
          "description": "The observable source."
        },
        {
          "name": "transform",
          "type": "((value: T) => unknown) | undefined",
          "optional": true,
          "description": "Optional function that converts the source value to the\nproperty value."
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "<T>(property: string, obs: Observable<T>, transform?: (value: T) => unknown) => void"
    },
    {
      "name": "bindAttribute",
      "type": "<T>(attribute: string, obs: Observable<T>, transform?: (value: T) => unknown) => void",
      "description": "Binds an observable value to an HTML attribute.\n\nA `null` or `undefined` mapped value removes the attribute. Use this for\n`aria-*`, `data-*`, and other attributes; use bindProperty() for native\nDOM properties such as `disabled` or `value`.",
      "tags": [
        {
          "name": "param",
          "text": "attribute The attribute name."
        },
        {
          "name": "param",
          "text": "obs The observable source."
        },
        {
          "name": "param",
          "text": "transform Optional function that converts the source value to an\nattribute value."
        },
        {
          "name": "example",
          "text": "component.bindAttribute(\"aria-label\", count, value => `Count: ${value}`)"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "parameters": [
        {
          "name": "attribute",
          "type": "string",
          "optional": false,
          "description": "The attribute name."
        },
        {
          "name": "obs",
          "type": "Observable<T>",
          "optional": false,
          "description": "The observable source."
        },
        {
          "name": "transform",
          "type": "((value: T) => unknown) | undefined",
          "optional": true,
          "description": "Optional function that converts the source value to an\nattribute value."
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "<T>(attribute: string, obs: Observable<T>, transform?: (value: T) => unknown) => void"
    },
    {
      "name": "bindStyle",
      "type": "<T>(property: string, obs: Observable<T>, transform?: (value: T) => unknown) => void",
      "description": "Binds an observable value to a CSS style property.\n\nCSS custom properties such as `--progress` are supported. A `null` or\n`undefined` mapped value clears the style property.",
      "tags": [
        {
          "name": "param",
          "text": "property The CSS property name."
        },
        {
          "name": "param",
          "text": "obs The observable source."
        },
        {
          "name": "param",
          "text": "transform Optional function that converts the source value to a\nCSS value."
        },
        {
          "name": "example",
          "text": "component.bindStyle(\"opacity\", visible, value => value ? \"1\" : \"0\")"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "parameters": [
        {
          "name": "property",
          "type": "string",
          "optional": false,
          "description": "The CSS property name."
        },
        {
          "name": "obs",
          "type": "Observable<T>",
          "optional": false,
          "description": "The observable source."
        },
        {
          "name": "transform",
          "type": "((value: T) => unknown) | undefined",
          "optional": true,
          "description": "Optional function that converts the source value to a\nCSS value."
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "<T>(property: string, obs: Observable<T>, transform?: (value: T) => unknown) => void"
    },
    {
      "name": "bindClass",
      "type": "<T>(className: string | string[], obs: Observable<T>, predicate?: (value: T) => boolean) => void",
      "description": "Toggles a CSS class from an observable value.\n\nThe class is enabled when the optional predicate returns true, or when\nthe source value is truthy if no predicate is supplied. The subscription\nis disposed automatically with the component.",
      "tags": [
        {
          "name": "param",
          "text": "className One literal CSS class name, or an array of class names, to toggle."
        },
        {
          "name": "param",
          "text": "obs The observable source."
        },
        {
          "name": "param",
          "text": "predicate Optional function that decides whether the class is on."
        },
        {
          "name": "example",
          "text": "component.bindClass([\"is-loading\", \"has-error\"], isInvalid)"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "parameters": [
        {
          "name": "className",
          "type": "string | string[]",
          "optional": false,
          "description": "One literal CSS class name, or an array of class names, to toggle."
        },
        {
          "name": "obs",
          "type": "Observable<T>",
          "optional": false,
          "description": "The observable source."
        },
        {
          "name": "predicate",
          "type": "((value: T) => boolean) | undefined",
          "optional": true,
          "description": "Optional function that decides whether the class is on."
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "<T>(className: string | string[], obs: Observable<T>, predicate?: (value: T) => boolean) => void"
    },
    {
      "name": "bindUiStyle",
      "type": "<T>(uiStyle: UiStyle | UiStyle[], obs: Observable<T>, predicate?: (value: T) => boolean) => void",
      "description": "Toggles one or more typed Elgora UI styles from an observable value.\n\nStyle names are automatically converted to their generated CSS class names:\n`selected` becomes `elg-selected`, while `elg` remains `elg`. The class\nnames are enabled when the optional predicate returns true, or when the\nsource value is truthy if no predicate is supplied. The subscription is\ndisposed automatically with the component.",
      "tags": [
        {
          "name": "param",
          "text": "uiStyle One UI style, or an array of UI styles, to toggle."
        },
        {
          "name": "param",
          "text": "obs The observable source."
        },
        {
          "name": "param",
          "text": "predicate Optional function that decides whether the styles are on."
        },
        {
          "name": "example",
          "text": "component.bindUiStyle([\"selected\", \"text-primary\"], isSelected)"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "parameters": [
        {
          "name": "uiStyle",
          "type": "UiStyle | UiStyle[]",
          "optional": false,
          "description": "One UI style, or an array of UI styles, to toggle."
        },
        {
          "name": "obs",
          "type": "Observable<T>",
          "optional": false,
          "description": "The observable source."
        },
        {
          "name": "predicate",
          "type": "((value: T) => boolean) | undefined",
          "optional": true,
          "description": "Optional function that decides whether the styles are on."
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "<T>(uiStyle: UiStyle | UiStyle[], obs: Observable<T>, predicate?: (value: T) => boolean) => void"
    },
    {
      "name": "renderOnChange",
      "type": "<T>(obs: ObservableValue<T>, renderTask: RenderTask) => void",
      "description": "Registers a render task that runs when an observable value changes.\n\nThe current value is rendered immediately. The subscription is disposed\nautomatically when the component is disposed, not when it is unmounted, so\nthe reactive state remains available across mount/unmount cycles.\nMultiple calls with the same task create independent subscriptions.",
      "tags": [
        {
          "name": "param",
          "text": "obs The observable value to subscribe to."
        },
        {
          "name": "param",
          "text": "renderTask The function that performs DOM updates."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "parameters": [
        {
          "name": "obs",
          "type": "ObservableValue<T>",
          "optional": false,
          "description": "The observable value to subscribe to."
        },
        {
          "name": "renderTask",
          "type": "RenderTask",
          "optional": false,
          "description": "The function that performs DOM updates."
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "<T>(obs: ObservableValue<T>, renderTask: RenderTask) => void"
    },
    {
      "name": "render",
      "type": "(renderTask: RenderTask) => void",
      "description": "Schedules a render task on the next animation frame.\n\nMultiple calls for the same task within one frame are coalesced. Scheduling\nis independent of whether the component is currently mounted.",
      "tags": [
        {
          "name": "param",
          "text": "renderTask The function that performs the DOM update."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "parameters": [
        {
          "name": "renderTask",
          "type": "RenderTask",
          "optional": false,
          "description": "The function that performs the DOM update."
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(renderTask: RenderTask) => void"
    },
    {
      "name": "refresh",
      "type": "() => void",
      "description": "Schedules all registered render tasks on the next animation frame.\n\nUse this when a component needs a full reactive refresh after an external\nchange that is not represented by one of its observable values.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "attached",
      "type": "boolean",
      "description": "Whether the component's DOM is connected anywhere in the document.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "kind": "property"
    },
    {
      "name": "mounted",
      "type": "boolean",
      "description": "Whether this component has completed its mount lifecycle.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "kind": "property"
    },
    {
      "name": "disposed",
      "type": "ObservableValue<boolean>",
      "description": "Observable state that becomes `true` after permanent disposal.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "kind": "property"
    },
    {
      "name": "dispose",
      "type": "() => void",
      "description": "Permanently disposes this component and its descendants.\n\nDisposal unmounts the component, disposes child components, releases all\nresources registered through the component cleanup APIs, and invokes\n`comdispose`. It is terminal: a disposed component cannot be mounted again.\nUse `unmount()` when the component may be reused later.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/Component.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    }
  ]
};
