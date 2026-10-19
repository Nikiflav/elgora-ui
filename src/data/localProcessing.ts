/** @internal Accepts native, cross-realm and custom thenable results. */
export function isPromiseLike<T = any>(value: any): value is PromiseLike<T> {
    return value != null && typeof value.then === "function";
}

/** @internal Runs synchronously until a callback actually needs to be awaited. Preserves order. */
export function runSequential<T>(items: readonly T[], visit: (item: T) => void | PromiseLike<void>, start = 0): void | Promise<void> {
    for (let index = start; index < items.length; index++) {
        const result = visit(items[index]);
        if (isPromiseLike(result))
            return Promise.resolve(result).then(() => runSequential(items, visit, index + 1));
    }
}
