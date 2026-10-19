/** Consistent cancellation for row work, including sources that ignore AbortSignal. */
export function throwIfRowQueryAborted(signal?: AbortSignal): void {
    if (signal?.aborted) throw new DOMException("Failed to load grid rows. The query was cancelled.", "AbortError");
}

/** Cancels this waiter without cancelling a page shared with other callers. */
export function waitForRowQuery<T>(task: Promise<T>, signal?: AbortSignal): Promise<T> {
    if (!signal) return task;
    return new Promise<T>((resolve, reject) => {
        const abort = () => {
            signal.removeEventListener("abort", abort);
            reject(new DOMException("Failed to load grid rows. The query was cancelled.", "AbortError"));
        };
        signal.addEventListener("abort", abort, { once: true });
        task.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
        if (signal.aborted) abort();
    });
}
