import '../colors.css';
import '../utility.css';
import '../style.css';
import '../loaders.css';
import 'remixicon/fonts/remixicon.css';


// ======================================================
// ElgoraUI - Minimal UI Runtime
// Vite / TypeScript library entry
// ======================================================

export interface Disposable {
  dispose(): void
}

export type ObservableHandler<T> = (value: T) => void


export interface Observable<T> extends Disposable {
  subscribe(fn: ObservableHandler<T>): Disposable
}

export interface ReadOnlyObservableValue<T> extends Observable<T> {
  readonly Value: T
}


export class ObservableValue<T> implements ReadOnlyObservableValue<T> {
  private _value: T
  private subscribers = new Set<ObservableHandler<T>>()

  constructor(initial: T) {
    this._value = initial
  }

  get Value(): T {
    return this._value
  }

  set Value(v: T) {
    if (Object.is(this._value, v)) return

    this._value = v
    this.notify()
  }

  /**
   * Subscribe to value changes.
   * @param fn Subscriber function to be called on value changes. Will be called immediately with the current value upon subscription.
   * @returns A disposable subscription object. Dispose to unsubscribe.
   */
  subscribe(fn: ObservableHandler<T>): Disposable {
    this.subscribers.add(fn)

    return {
      dispose: () => {
        this.subscribers.delete(fn)
      }
    }
  }
  /** Clear all subscribers */
  dispose(): void {
    this.subscribers.clear()
  }

  private notify(): void {
    for (const fn of this.subscribers) {
      fn(this._value)
    }
  }

  /**
  * Controls how object is converted to primitive
  */
  [Symbol.toPrimitive]() {
    return this._value as any
  }

  /**
   * Fallback for string conversion
   */
  toString() {
    return String(this._value)
  }

  valueOf() {
    return this._value as any
  }
}


export class ObservableEvent<T = void> implements Observable<T> {
  private handlers = new Set<ObservableHandler<T>>()

  /**
   * Subscribe to event
   */
  subscribe(fn: ObservableHandler<T>): Disposable {
    this.handlers.add(fn)

    return {
      dispose: () => {
        this.handlers.delete(fn)
      }
    }
  }

  /**
   * Invoke event
   */
  invoke(payload: T): void {
    for (const fn of this.handlers) {
      fn(payload)
    }
  }

  /**
   * Clear all handlers
   */
  dispose(): void {
    this.handlers.clear()
  }
}


/** A render task scheduled by the ElgoraUI scheduler. */
export type RenderTask = () => void

// ======================================================
// ElgoraUI Scheduler (Set-based, frame-batched)
// ======================================================


export class Scheduler {
  private tasks = new Set<RenderTask>()
  private rafId: number | null = null

  /**
   * Schedule a task.
   * Same function reference is automatically deduped.
   */
  schedule(task: RenderTask): void {
    this.tasks.add(task)
    this.requestFrame()
  }

  private requestFrame(): void {
    if (this.rafId != null) return

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null
      this.flush()
    })
  }

  private flush(): void {
    const tasks = this.tasks
    this.tasks = new Set()

    for (const task of tasks) {
      task()
    }
  }
}

/**
 * Global UI runtime instance.
 * Used to invalidate components and manage scheduling.
 */
export const ElgoraUI = {
  /**
   * Global scheduler instance.
   */
  scheduler: new Scheduler(),

}
