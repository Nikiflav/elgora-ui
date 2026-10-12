import { describe, expect, it } from "vitest";
import { AsyncObservableEvent } from "../../src/core/AsyncObservableEvent";
import { ObservableEvent } from "../../src/core/ElgoraUI";

describe("AsyncObservableEvent", () => {
    it("has only asynchronous dispatch and succeeds without subscribers", async () => {
        const event = new AsyncObservableEvent();
        expect("invoke" in event).toBe(false);
        await expect(event.invokeAsync()).resolves.toBeUndefined();
    });

    it("awaits mixed subscribers sequentially in registration order", async () => {
        const event = new AsyncObservableEvent<number>(), log: string[] = [];
        let release!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        event.subscribe(value => { log.push("first:" + value); });
        event.subscribe(async value => {
            log.push("start:" + value);
            await gate;
            log.push("finish:" + value);
        });
        event.subscribe(value => { log.push("last:" + value); });
        const invocation = event.invokeAsync(5);
        await Promise.resolve();
        expect(log).toEqual(["first:5", "start:5"]);
        release();
        await invocation;
        expect(log).toEqual(["first:5", "start:5", "finish:5", "last:5"]);
    });

    it("stops dispatch on synchronous throws and rejected promises", async () => {
        for (const asynchronous of [false, true]) {
            const event = new AsyncObservableEvent();
            let later = false;
            const error = new Error("Handler");
            const subscription = event.subscribe(() => {
                if (asynchronous) return Promise.reject(error);
                throw error;
            });
            event.subscribe(() => { later = true; });
            await expect(event.invokeAsync()).rejects.toBe(error);
            expect(later).toBe(false);
            subscription.dispose();
            await event.invokeAsync();
            expect(later).toBe(true);
        }
    });

    it("disposes subscriptions and deduplicates handler references", async () => {
        const event = new AsyncObservableEvent();
        let calls = 0;
        const handler = () => { calls++; };
        const subscription = event.subscribe(handler);
        event.subscribe(handler);
        await event.invokeAsync();
        expect(calls).toBe(1);
        subscription.dispose();
        subscription.dispose();
        await event.invokeAsync();
        expect(calls).toBe(1);
    });

    it("defers additions and skips removals during an invocation", async () => {
        const event = new AsyncObservableEvent(), log: string[] = [];
        const added = () => { log.push("added"); };
        event.subscribe(() => {
            log.push("first");
            event.subscribe(added);
            removed.dispose();
        });
        const removed = event.subscribe(() => { log.push("removed"); });
        await event.invokeAsync();
        expect(log).toEqual(["first"]);
        await event.invokeAsync();
        expect(log).toEqual(["first", "first", "added"]);
    });

    it("clearing an event skips remaining handlers but still awaits the current one", async () => {
        const event = new AsyncObservableEvent();
        let release!: () => void, completed = false, later = false;
        event.subscribe(async () => {
            await new Promise<void>(resolve => { release = resolve; });
            completed = true;
        });
        event.subscribe(() => { later = true; });
        const invocation = event.invokeAsync();
        event.dispose();
        expect(completed).toBe(false);
        release();
        await invocation;
        expect(completed).toBe(true);
        expect(later).toBe(false);
    });

    it("keeps synchronous UI dispatch unchanged", () => {
        const event = new ObservableEvent(), log: string[] = [];
        event.subscribe(() => { log.push("handler"); });
        event.invoke();
        log.push("caller");
        expect(log).toEqual(["handler", "caller"]);
        expect("invokeAsync" in event).toBe(false);
    });
});
