import * as Elgora from "../src/index";

function send(message: Record<string, unknown>): void {
    window.parent.postMessage(message, "*");
}

function clearDemo(): void {
    try {
    } catch { /* A new run should still be able to replace a failed demo. */ }
    document.body.replaceChildren();
}

window.addEventListener("message", async event => {
    if (event.data?.type !== "run") return;
    clearDemo();

    try {
        const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor as new (...args: string[]) => Function;
        const source = `with (Elgora) {\n${event.data.code}\n}`;
        const run = new AsyncFunction("Elgora", "log", source);
        await run(Elgora, (message: unknown) => {
            send({ type: "log", message: String(message) });
        });
        send({ type: "success" });
    } catch (error) {
        const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
        send({ type: "error", message });
    }
});

send({ type: "ready" });
