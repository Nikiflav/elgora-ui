import { describe, it, expect } from "vitest";
import { TabView } from "../../src/components/tab-view/TabView";

describe("TabView", () => {
    it("preserves content and skips disabled tabs during keyboard navigation", () => {
        const input = document.createElement("input"); input.value = "Unsaved";
        const tabs = new TabView({ label: "Properties", items: [
            { id: "basic", text: "Basic", content: input },
            { id: "disabled", text: "Unavailable", disabled: true },
            { id: "advanced", text: "Advanced", content: "Attributes" }
        ] });
        tabs.mount(document.body);
        try {
            const buttons = tabs.dom.querySelectorAll<HTMLButtonElement>('[role="tab"]');
            buttons[0].focus();
            buttons[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
            expect(tabs.selectedId).toBe("advanced");
            expect(document.activeElement).toBe(buttons[2]);
            expect(tabs.getPanel("basic")!.hidden).toBe(true);
            expect(tabs.select("disabled")).toBe(false);
            tabs.select("basic");
            expect(tabs.getPanel("basic")!.querySelector("input")).toBe(input);
            expect(input.value).toBe("Unsaved");
            expect(buttons[0].getAttribute("aria-controls")).toBe(tabs.getPanel("basic")!.id);
            tabs.setTabText("basic", "Свойства");
            expect(buttons[0].textContent).toBe("Свойства");
        } finally { tabs.dispose(); }
    });
});
