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

// ------------------------------------------------------
// Component
// ------------------------------------------------------

const ELEMENT_COMPONENT_KEY = "_elgComponent"

/** Base class for composable DOM components with lifecycle and observable state support. */
export class Component implements Disposable {
  dom: HTMLElement

  private _disposed = new ObservableValue(false)
  private _mounted = false

  protected disposables: Disposable[] = []
  protected renderTasks: RenderTask[] = []

  private _options: ComponentOptions
  private _locked = false


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

  /** Locks the component, preventing further structure modifications. */
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
   * Appends the dom to the provided container.
   * Always use this method to attach the component to the document, as it ensures that 'mount' lifecycle events are properly handled. Do not directly append the component's dom to the document or other containers, as this may lead to inconsistent state and missed lifecycle events.
   * This will trigger the onMount lifecycle event for this component and all of its descendants. If the component is already mounted, calling this method again will have no effect.
   * @param container The DOM element to which the component's dom will be appended. 
    * @example
    * const myComponent = new Component({ tag: "div", children: "Hello, world!" })
    * myComponent.mount(document.body) // Appends the component's dom to the body and triggers onMount events.
   */
  mount(container: HTMLElement): void {
    this.unmount() // Ensure it's not already mounted somewhere else
    container.appendChild(this.dom)
    this.tryMountTree()
  }

  /**
   * Unmounts the component from the DOM. This will trigger the onUnmount lifecycle event for this component and all of its descendants. After unmounting, the component's dom will be removed from its parent element, but the component instance will still exist in memory and can be re-mounted later if needed. Always use this method to unmount the component, as it ensures that 'unmount' lifecycle events are properly handled. Do not directly remove the component's dom from the document or other containers, as this may lead to inconsistent state and missed lifecycle events.
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

  protected onMount(): void {

  }

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
   * Register a render task that will be automatically scheduled to run whenever the given observable value changes. The current value of the observable will also be used to perform an initial render when this method is called.
   * The subscribtion is automatically disposed when the component is disposed. Multiple calls to renderOnChange() with the same renderTask will result in multiple subscribtions, and each subscription will trigger the renderTask independently when the observable changes.
   * @param obs An observable value to subscribe to. 
   * @param renderTask A function that performs DOM updates. 
   */
  renderOnChange<T>(obs: ObservableValue<T>, renderTask: RenderTask): void {
    this.renderTasks.push(renderTask)

    const sub = obs.subscribe(() => this.render(renderTask))
    this.disposables.push(sub)

    this.render(renderTask)
  }

  /**
   * Schedule a render task to run on the next animation frame. Multiple calls to render() for the same task within the same frame will be coalesced into a single call.
   * @param renderTask A function that performs DOM updates. Will be scheduled to run on the next animation frame. Multiple calls to render() within the same frame will be coalesced into a single call.
   */
  render(renderTask: RenderTask): void {
    ElgoraUI.scheduler.schedule(renderTask)
  }

  /** 
   * Schedules all registered render tasks to run on the next animation frame.
   * Used when hard refresh is needed.
   */
  refresh(): void {
    for (const t of this.renderTasks) this.render(t);
  }

  // --------------------------------------------------
  // State
  // --------------------------------------------------

  get attached(): boolean {
    return this.dom.isConnected
  }

  get mounted(): boolean {
    return this._mounted
  }

  get disposed(): ObservableValue<boolean> {
    return this._disposed
  }

  // --------------------------------------------------
  // Dispose
  // --------------------------------------------------

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
      d.dispose()
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

