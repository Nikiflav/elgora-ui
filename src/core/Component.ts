// ======================================================
// ElgoraUI Component System (encapsulated tree)
// ======================================================

import { Disposable, ObservableValue, RenderTask, Observable, ElgoraUI } from "./ElgoraUI"
import { UiStyle } from "./UiStyle"


// ------------------------------------------------------

type ComponentEventHandler = (event: Event, com: Component) => void

type DOMProps = {
  [key: string]: any
} & {
  [K in `on${string}`]?: ComponentEventHandler
}

/** A value that can be mounted as a Component child. */
export type ComponentChild =
  | string
  | number
  | Node
  | Component
  | null
  | undefined
  | ComponentChild[]

export const ComponentLifecycleKeys = [
  "comcreate",
  "commount",
  "comunmount",
  "comdispose"
] as const

export type ComponentLifecycleKey =
  typeof ComponentLifecycleKeys[number]

export type ComponentLifecycleProps = {
  [K in ComponentLifecycleKey]?:
  (com: Component) => void
}

/** Configuration for a Component instance, including DOM and lifecycle props. */
export type ComponentOptions = {
  tag?: string
  key?: any
  ui?: UiStyle | UiStyle[]

  children?: ComponentChild
} & ComponentLifecycleProps & DOMProps

type ComponentCleanup = Disposable | (() => void)

// ------------------------------------------------------
// Component
// ------------------------------------------------------

const ELEMENT_COMPONENT_KEY = "_elgComponent"

/** Base class for composable DOM components with lifecycle and observable state support. */
export class Component implements Disposable {
  /** The native HTMLElement owned by this component. */
  dom: HTMLElement

  private _disposed = new ObservableValue(false)
  private _mounted = false

  protected disposables: ComponentCleanup[] = []
  protected renderTasks: RenderTask[] = []

  private _options: ComponentOptions
  private _locked = false


  /**
   * Creates a component and its native DOM root.
   *
   * The constructor creates the element, applies DOM options, appends initial
   * children, and invokes `comcreate` once. The component is not mounted by
   * the constructor; use `mount()` to connect it to a document or container.
   *
   * @param options DOM, child, and lifecycle options for the component.
   */
  constructor(options: ComponentOptions = {}) {
    this._options = options
    this.dom = document.createElement(options.tag || "div")
      ; (this.dom as any)[ELEMENT_COMPONENT_KEY] = this

    this.applyProps(options)

    if (options.children !== undefined) {
      this.append(options.children)
    }

    options.comcreate?.(this)
  }

  /**
   * User state.
   */
  state?: any;

  /**  
   * Indicates whether the component is locked. When a component is locked, it cannot accept new children, and any attempt to append a child will result in an error. Locking a component is useful for preventing further modifications to the component's structure after it has been fully constructed and mounted. This ensures the integrity of the component tree and prevents unintended side effects from adding new children after the component is in use.
  */
  get locked() {
    return this._locked
  }

  /**
   * Locks the component, preventing further structure modifications.
   *
   * After locking, `append()` throws instead of adding children. Locking does
   * not affect rendering, mounting, unmounting, or disposal.
   */
  lock(): void {
    this._locked = true
  }

  /**
   * Appends a child or multiple children to this component. The child can be a string, number, DOM node, another Component instance, or an array of any of these types. When a Component instance is appended as a child, it will be automatically detached from its previous parent (if any) before being added to this component. This ensures that a Component can only have one parent at a time, maintaining the integrity of the component tree. If the child is null or undefined, this method will have no effect.
   * If the component is locked, an error will be thrown and the child will not be appended. Always use this method to add children to the component, as it ensures that the component tree remains consistent and that lifecycle events are properly handled. Do not directly manipulate the component's dom to add children, as this may lead to inconsistent state and missed lifecycle events.
   * @param child The child to append.
   * @returns void
   */
  append(child: ComponentChild): void {
    if (child == null) return

    if (this._locked) {
      throw new Error("Attempted to append child to a locked component. This operation is not allowed.")
    }

    if (Array.isArray(child)) {
      for (const c of child) this.append(c)
      return
    }

    if (typeof child === "string" || typeof child === "number") {
      this.dom.appendChild(document.createTextNode(String(child)))
      return
    }

    if (child instanceof Component) {
      // detach from previous parent
      if (child.dom.parentElement) {
        child.dom.parentElement.removeChild(child.dom)
      }
      child.mount(this.dom) // Mount the child to this component's dom
      return
    }

    if (child instanceof Node) {
      if (child.parentElement) {
        child.parentElement.removeChild(child)
      }
      this.dom.appendChild(child)
    }
  }

  // --------------------------------------------------
  // Props
  // --------------------------------------------------

  private applyProps(options: ComponentOptions) {
    const el = this.dom

    for (const key in options) {
      if (
        key === "tag" ||
        key === "children" ||
        key === "key" ||
        ComponentLifecycleKeys.indexOf(key as any) > -1
      ) continue

      const value = options[key]

      // Events
      if (key.startsWith("on") && typeof value === "function") {
        const event = key.slice(2).toLowerCase()
        el.addEventListener(event, (e) => value(e, this))
        continue
      }

      // Style
      if (key === "style" && typeof value === "object") {
        Object.assign(el.style, value)
        continue
      }

      // UI
      if (key === "ui") {
        applyUi(el, value)
        continue
      }

      // Class
      if (key === "class" || key === "className") {
        if (value)
          el.classList.add(...value.split(" "))
        continue
      }

      // Property
      if (key in el) {
        try {
          ; (el as any)[key] = value
          continue
        } catch { }
      }

      el.setAttribute(key, String(value))
    }
  }

  // --------------------------------------------------
  // Mount / Unmount
  // --------------------------------------------------

  /**
   * Appends the component DOM to the provided container.
   *
   * Always use this method to attach a component to the document. It keeps the
   * component lifecycle state consistent and triggers mount lifecycle callbacks
   * for the complete component subtree. The current component is mounted first,
   * followed by its descendants (parent-to-child order).
   *
   * A child component is discovered from the DOM tree and mounted automatically;
   * lifecycle callbacks are not copied from the parent to the child. Each
   * component receives its own `commount` callback and `onMount()` call.
   *
   * If the component is already mounted, it is first unmounted and then moved
   * to the new container. The component instance and its state are preserved.
   *
   * @param container The HTMLElement or CSS selector to which the component's
   * DOM will be appended.
   * @example
   * const myComponent = new Component({ tag: "div", children: "Hello, world!" })
   * myComponent.mount(document.body) // Mounts the component and its descendants.
   */
  mount(container: HTMLElement | string): void {
    if (this._disposed.Value) {
      throw new Error("Cannot mount a disposed component.")
    }

    let target: HTMLElement
    if (typeof container === "string") {
      const resolved = document.querySelector(container)
      if (!resolved) {
        throw new Error(`Cannot mount component: selector "${container}" did not match an element.`)
      }
      if (!(resolved instanceof HTMLElement)) {
        throw new Error(`Cannot mount component: selector "${container}" did not match an HTMLElement.`)
      }
      target = resolved
    } else {
      target = container
    }

    this.unmount() // Ensure it's not already mounted somewhere else
    target.appendChild(this.dom)
    this.tryMountTree()
  }

  /**
   * Unmounts the component from the DOM without disposing the component.
   *
   * Unmount lifecycle callbacks are invoked for descendants first and then for
   * the current component (child-to-parent order). Each component receives its
   * own `comunmount` callback and `onUnmount()` call; the callbacks are not
   * propagated or shared between parent and child components.
   *
   * Use `onUnmount()` to release resources that depend on an external mount
   * context, such as listeners on a host container, `window`, or `document`.
   * Resources owned by the component itself may remain available while it is
   * unmounted. The component's state is preserved and it can be mounted again.
   *
   * Always use this method instead of removing `dom` directly, otherwise
   * lifecycle callbacks will not run and descendants can retain stale state.
   */
  unmount(): void {
    if (!this._mounted) return

    this.triggerRecursiveOnUnmount()

    if (this.dom.parentElement) {
      this.dom.parentElement.removeChild(this.dom)
    }
  }

  private tryMountTree(): void {
    if (!this.dom.isConnected) return
    this.triggerRecursiveOnMount()
  }

  private static collectChildren(dom: HTMLElement): Component[] {
    const childComponents: Component[] = []
    for (const childElement of dom.children) {
      const component = (childElement as any)[ELEMENT_COMPONENT_KEY] as Component | undefined
      if (component) {
        childComponents.push(component)
      } else if (childElement instanceof HTMLElement) {
        childComponents.push(...Component.collectChildren(childElement))
      }
    }
    return childComponents
  }

  /**
   * Returns all child components of this component.
   * The child components are collected from the dom children via dom[ELEMENT_COMPONENT_KEY] property.
   */
  private get children(): Component[] {
    return Component.collectChildren(this.dom)
  }

  private triggerRecursiveOnMount(): void {
    if (this._mounted) return

    this._mounted = true
    this._options.commount?.(this)
    this.onMount()

    for (const child of this.children) {
      child.triggerRecursiveOnMount()
    }
  }

  /**
   * Called after this component's DOM is connected and before its descendants
   * are mounted.
   *
   * Override this hook for work that requires the component to be connected to
   * the document, especially subscriptions to an external mount container,
   * `window`, or `document`. Pair that work with cleanup in `onUnmount()`.
   * Subclasses should not invoke this method manually; it is called by the
   * recursive component lifecycle.
   */
  protected onMount(): void {

  }

  /**
   * Called before this component's DOM is removed from its parent and after all
   * descendants have been unmounted.
   *
   * Override this hook to remove subscriptions and other resources created in
   * `onMount()`. The component remains alive after this hook and may be mounted
   * again. Permanent resources should instead be released by `dispose()`.
   * Subclasses should not invoke this method manually; it is called by the
   * recursive component lifecycle.
   */
  protected onUnmount(): void {

  }

  private triggerRecursiveOnUnmount(): void {
    if (!this._mounted) return

    const children = Component.collectChildren(this.dom)
    for (const child of children) {
      child.triggerRecursiveOnUnmount()
    }

    this._mounted = false
    this._options.comunmount?.(this)
    this.onUnmount()
  }

  // --------------------------------------------------
  // Reactive helpers
  // --------------------------------------------------

  /**
   * Create an observable value that is automatically disposed when the component is disposed. The returned ObservableValue can be used to create reactive components by subscribing to it or using it in renderOnChange(). When the component is disposed, all created observable values will be automatically disposed as well, preventing memory leaks and ensuring proper cleanup of resources.
   * @param value The initial value of the observable.
   * @returns The created ObservableValue instance, which is automatically disposed when the component is disposed. The returned ObservableValue can be used to create reactive components by subscribing to it or using it in renderOnChange(). When the component is disposed, all created observable values will be automatically disposed as well, preventing memory leaks and ensuring proper cleanup of resources.
    * @example
    * const count = this.observable(0)
   */
  observable<T>(value: T): ObservableValue<T> {
    const o = new ObservableValue(value)
    this.disposables.push(o)
    return o
  }

  /**
   * Subscribe to an observable value. The callback will be called whenever the observable value changes, and also immediately with the current value upon subscription.
   * @param obs An observable to subscribe to. 
   * @param callback A function to be called whenever the observable value changes. 
   */
  subscribe<T>(obs: Observable<T>, callback: (v: T) => void): void {
    this.disposables.push(obs.subscribe(callback))
  }

  /**
   * Registers a resource cleanup callback that runs when the component is
   * disposed. Use this for event listeners, observers, timers, and other
   * resources that are not themselves Disposable objects.
   *
   * @param cleanup A Disposable resource or a callback that releases it.
   *
   * @example
   * component.addCleanup(() => window.removeEventListener("resize", handler))
   */
  addCleanup(cleanup: ComponentCleanup): void {
    if (this._disposed.Value) {
      if (typeof cleanup === "function") cleanup()
      else cleanup.dispose()
      return
    }

    this.disposables.push(cleanup)
  }

  /**
   * Adds an event listener owned by the component. The listener is removed
   * automatically when the component is disposed. If the listener belongs to
   * an external mount context, add and remove it explicitly in `onMount()` and
   * `onUnmount()` instead; calling `listen()` repeatedly from `onMount()` would
   * otherwise register a new listener on every mount cycle.
   *
   * @param target The EventTarget receiving the listener.
   * @param type The event name.
   * @param listener The event listener.
   * @param options Native event listener options.
   */
  listen(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    target.addEventListener(type, listener, options)
    this.addCleanup(() => target.removeEventListener(type, listener, options))
  }

  /**
   * Registers an observer owned by the component. Its disconnect method is
   * called automatically when the component is disposed. Observers that should
   * exist only while the component is mounted should be created and disconnected
   * in `onMount()` and `onUnmount()` instead.
   *
   * @param observer An observer with a disconnect method, such as ResizeObserver.
   */
  observe(observer: { disconnect(): void }): void {
    this.addCleanup(() => observer.disconnect())
  }

  /**
   * Binds an observable value to a native DOM property.
   *
   * The initial update is scheduled immediately for ObservableValue instances
   * and then refreshed on the next animation frame after each observable update.
   * The subscription is disposed automatically with the component.
   *
   * @param property The DOM property to assign, for example `textContent`,
   * `value`, `disabled`, or `checked`.
   * @param obs The observable source.
   * @param transform Optional function that converts the source value to the
   * property value.
   *
   * @example
   * component.bindProperty("textContent", count, value => `Count: ${value}`)
   */
  bindProperty<T>(
    property: string,
    obs: Observable<T>,
    transform?: (value: T) => unknown
  ): void {
    this.bindObservable(obs, value => {
      ; (this.dom as any)[property] = transform ? transform(value) : value
    })
  }

  /**
   * Binds an observable value to an HTML attribute.
   *
   * A `null` or `undefined` mapped value removes the attribute. Use this for
   * `aria-*`, `data-*`, and other attributes; use bindProperty() for native
   * DOM properties such as `disabled` or `value`.
   *
   * @param attribute The attribute name.
   * @param obs The observable source.
   * @param transform Optional function that converts the source value to an
   * attribute value.
   *
   * @example
   * component.bindAttribute("aria-label", count, value => `Count: ${value}`)
   */
  bindAttribute<T>(
    attribute: string,
    obs: Observable<T>,
    transform?: (value: T) => unknown
  ): void {
    this.bindObservable(obs, value => {
      const result = transform ? transform(value) : value
      if (result === null || result === undefined) {
        this.dom.removeAttribute(attribute)
      } else {
        this.dom.setAttribute(attribute, String(result))
      }
    })
  }

  /**
   * Binds an observable value to a CSS style property.
   *
   * CSS custom properties such as `--progress` are supported. A `null` or
   * `undefined` mapped value clears the style property.
   *
   * @param property The CSS property name.
   * @param obs The observable source.
   * @param transform Optional function that converts the source value to a
   * CSS value.
   *
   * @example
   * component.bindStyle("opacity", visible, value => value ? "1" : "0")
   */
  bindStyle<T>(
    property: string,
    obs: Observable<T>,
    transform?: (value: T) => unknown
  ): void {
    this.bindObservable(obs, value => {
      const result = transform ? transform(value) : value
      this.dom.style.setProperty(property, result === null || result === undefined ? "" : String(result))
    })
  }

  /**
   * Toggles a CSS class from an observable value.
   *
   * The class is enabled when the optional predicate returns true, or when
   * the source value is truthy if no predicate is supplied. The subscription
   * is disposed automatically with the component.
   *
   * @param className One literal CSS class name, or an array of class names, to toggle.
   * @param obs The observable source.
   * @param predicate Optional function that decides whether the class is on.
   *
   * @example
   * component.bindClass(["is-loading", "has-error"], isInvalid)
   */
  bindClass<T>(
    className: string | string[],
    obs: Observable<T>,
    predicate?: (value: T) => boolean
  ): void {
    const classNames = Array.isArray(className) ? className : [className]
    this.bindObservable(obs, value => {
      const enabled = predicate ? predicate(value) : Boolean(value)
      for (const name of classNames) this.dom.classList.toggle(name, enabled)
    })
  }

  /**
   * Toggles one or more typed Elgora UI styles from an observable value.
   *
   * Style names are automatically converted to their generated CSS class names:
   * `selected` becomes `elg-selected`, while `elg` remains `elg`. The class
   * names are enabled when the optional predicate returns true, or when the
   * source value is truthy if no predicate is supplied. The subscription is
   * disposed automatically with the component.
   *
   * @param uiStyle One UI style, or an array of UI styles, to toggle.
   * @param obs The observable source.
   * @param predicate Optional function that decides whether the styles are on.
   *
   * @example
   * component.bindUiStyle(["selected", "text-primary"], isSelected)
   */
  bindUiStyle<T>(
    uiStyle: UiStyle | UiStyle[],
    obs: Observable<T>,
    predicate?: (value: T) => boolean
  ): void {
    const styles = Array.isArray(uiStyle) ? uiStyle : [uiStyle]
    const classNames = styles.map(style => style === "elg" ? "elg" : `elg-${style}`)
    this.bindClass(classNames, obs, predicate)
  }

  private bindObservable<T>(obs: Observable<T>, update: (value: T) => void): void {
    let latestValue!: T
    let hasValue = false
    const renderTask = () => {
      if (hasValue) update(latestValue)
    }

    const sub = obs.subscribe(value => {
      latestValue = value
      hasValue = true
      this.render(renderTask)
    })
    this.disposables.push(sub)

    if (obs instanceof ObservableValue) {
      latestValue = obs.Value
      hasValue = true
      this.render(renderTask)
    }
  }

  /**
   * Registers a render task that runs when an observable value changes.
   *
   * The current value is rendered immediately. The subscription is disposed
   * automatically when the component is disposed, not when it is unmounted, so
   * the reactive state remains available across mount/unmount cycles.
   * Multiple calls with the same task create independent subscriptions.
   *
   * @param obs The observable value to subscribe to.
   * @param renderTask The function that performs DOM updates.
   */
  renderOnChange<T>(obs: ObservableValue<T>, renderTask: RenderTask): void {
    this.renderTasks.push(renderTask)

    const sub = obs.subscribe(() => this.render(renderTask))
    this.disposables.push(sub)

    this.render(renderTask)
  }

  /**
   * Schedules a render task on the next animation frame.
   *
   * Multiple calls for the same task within one frame are coalesced. Scheduling
   * is independent of whether the component is currently mounted.
   *
   * @param renderTask The function that performs the DOM update.
   */
  render(renderTask: RenderTask): void {
    ElgoraUI.scheduler.schedule(renderTask)
  }

  /**
   * Schedules all registered render tasks on the next animation frame.
   *
   * Use this when a component needs a full reactive refresh after an external
   * change that is not represented by one of its observable values.
   */
  refresh(): void {
    for (const t of this.renderTasks) this.render(t);
  }

  // --------------------------------------------------
  // State
  // --------------------------------------------------

  /** Whether the component's DOM is connected anywhere in the document. */
  get attached(): boolean {
    return this.dom.isConnected
  }

  /** Whether this component has completed its mount lifecycle. */
  get mounted(): boolean {
    return this._mounted
  }

  /** Observable state that becomes `true` after permanent disposal. */
  get disposed(): ObservableValue<boolean> {
    return this._disposed
  }

  // --------------------------------------------------
  // Dispose
  // --------------------------------------------------

  /**
   * Permanently disposes this component and its descendants.
   *
   * Disposal unmounts the component, disposes child components, releases all
   * resources registered through the component cleanup APIs, and invokes
   * `comdispose`. It is terminal: a disposed component cannot be mounted again.
   * Use `unmount()` when the component may be reused later.
   */
  dispose(): void {
    if (this._disposed.Value) return

    this._disposed.Value = true

    this.unmount()

    for (const c of this.children) {
      c.dispose()
    }

    if (this.dom.parentElement) {
      this.dom.parentElement.removeChild(this.dom)
    }

    for (const d of this.disposables) {
      if (typeof d === "function") d()
      else d.dispose()
    }

    this._options.comdispose?.(this)
  }
}

// ------------------------------------------------------
// Factory
// ------------------------------------------------------

export function applyUi(
  el: HTMLElement,
  ui?: UiStyle | UiStyle[] | null | false
): void {
  if (!ui) return

  const list = Array.isArray(ui) ? ui : [ui]

  for (const s of list) {
    if (!s) continue
    if (s == "elg")
      el.classList.add("elg")
    else
      el.classList.add(`elg-${s}`)
  }
}

export function component(options: ComponentOptions): Component {
  return new Component(options)
}

