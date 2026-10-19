/// <reference types="vite/client" />

import * as Elgora from "../src/index";
import { syncDemoTheme } from "./app/syncDemoTheme";

if (window.parent !== window) {
    const stopThemeSync = syncDemoTheme(window.parent.document, document);
    window.addEventListener("pagehide", stopThemeSync, { once: true });
}

const demoModules = import.meta.glob(["./content/**/*.md.ts", "./content/**/*.md.*.ts"]);
function disposeDemoScrollbars(): void {
    // install() returns the current installation. A demo may have disposed and
    // recreated it through its own controls, so do not retain an older handle.
    Elgora.Scrollbars.install(window).dispose();
}

window.addEventListener("pagehide", disposeDemoScrollbars, { once: true });

function send(message: Record<string, unknown>): void {
    window.parent.postMessage(message, "*");
}

function clearDemo(): void {
    // Release owned overlays before removing the old demo's DOM.
    disposeDemoScrollbars();
    document.body.replaceChildren();
    // Install before running the example so explicit attachments and local
    // installations can take ownership or override the sandbox defaults.
    Elgora.Scrollbars.install(window, { scrollbarMode: "thin" });
}

window.addEventListener("message", async event => {
    if (event.data?.type !== "run" && event.data?.type !== "run-module") return;
    clearDemo();

    try {
        if (event.data.type === "run-module") {
            const loadDemo = demoModules[event.data.module as string];
            if (!loadDemo) throw new Error(`Demo module not found: ${event.data.module}`);
            const demo = await loadDemo() as { default: () => void | Promise<void> };
            await demo.default();
        } else {
            const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor as new (...args: string[]) => Function;
            const source = `with (Elgora) {\n${event.data.code}\n}`;
            const run = new AsyncFunction("Elgora", "log", source);
            await run(Elgora, (message: unknown) => {
                send({ type: "log", message: String(message) });
            });
        }
        send({ type: "success" });
    } catch (error) {
        const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
        send({ type: "error", message });
    }
});

send({ type: "ready" });
