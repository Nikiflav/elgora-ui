import '../colors.css';
import '../style.css';
import '../utility.css';
import '../website.css';
import '../loaders.css';
import 'remixicon/fonts/remixicon.css';


// ======================================================
// ElgoraUI - Minimal UI Runtime
// Vite / TypeScript library entry
// ======================================================

/** Resource or subscription whose owned work can be released explicitly. */
export interface Disposable {
  /** Releases the resources owned by this object. */
  dispose(): void
}

/** Receives a value emitted by an observable source. */
export type ObservableHandler<T> = (value: T) => void


/** A subscribable source of values or events. */
export interface Observable<T> extends Disposable {
  /** Registers a listener and returns a handle that removes only that listener. */
  subscribe(fn: ObservableHandler<T>): Disposable
}

/** Observable value that consumers may read but cannot assign through this interface. */
export interface ReadOnlyObservableValue<T> extends Observable<T> {
  /** Current value. Subscribe separately to observe subsequent changes. */
  readonly Value: T
}


/** Mutable observable value that notifies subscribers when its value changes. */
export class ObservableValue<T> implements ReadOnlyObservableValue<T> {
  private _value: T
  private subscribers = new Set<ObservableHandler<T>>()

  /** Creates a value holder without emitting an initial notification. */
  constructor(initial: T) {
    this._value = initial
  }

  /** Current value; assignments notify synchronously only when Object.is reports a change. */
  get Value(): T {
    return this._value
  }

  /** Assigns the value by reference and synchronously notifies registered listeners if it changed. */
  set Value(v: T) {
    if (Object.is(this._value, v)) return

    this._value = v
    this.notify()
  }

  /**
   * Subscribe to value changes.
   * @param fn Receives subsequent changes only. Read Value explicitly for the current value.
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

  /** Returns the current value for JavaScript value conversion. */
  valueOf() {
    return this._value as any
  }
}


/** Observable event stream whose payload is emitted explicitly by the caller. */
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


/** Frame-batched task scheduler that deduplicates the same task reference. */
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
