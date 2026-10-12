import type { Disposable } from "./ElgoraUI";

/** A synchronous or asynchronous event handler. Return or await all work that later handlers depend on. */
export type AsyncObservableHandler<T> = (value: T) => void | PromiseLike<void>;

/**
 * Event stream that awaits subscribers sequentially, in subscription order.
 * invokeAsync() is the only dispatch method. A thrown error or rejected Promise stops dispatch
 * and rejects the invocation. Different invocations are independent and may overlap.
 * Subscriptions added during dispatch run on the next invocation; removed subscriptions are skipped.
 * @example
 * const event = new AsyncObservableEvent<string>();
 * const subscription = event.subscribe(async value => { await persist(value); });
 * await event.invokeAsync("updated");
 * subscription.dispose();
 */
export class AsyncObservableEvent<T = void> implements Disposable {
    private handlers = new Set<AsyncObservableHandler<T>>();

    /** Registers a handler; dispose the returned subscription to unsubscribe. Duplicate handlers run once. */
    subscribe(handler: AsyncObservableHandler<T>): Disposable {
        this.handlers.add(handler);
        return { dispose: () => { this.handlers.delete(handler); } };
    }

    /** Awaits each handler before starting the next. Failure rejects and prevents later handlers from running. */
    async invokeAsync(payload: T): Promise<void> {
        for (const handler of [...this.handlers]) {
            if (this.handlers.has(handler)) await handler(payload);
        }
    }

    /** Removes subscriptions; an already running handler is still awaited and is not cancelled. */
    dispose(): void { this.handlers.clear(); }
}
