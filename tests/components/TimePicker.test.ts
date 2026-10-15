import { afterEach, describe, expect, it } from "vitest";
import { TimePicker } from "../../src/components/time-picker/TimePicker";

const pickers: TimePicker[] = [];
afterEach(() => { pickers.splice(0).forEach(picker => picker.dispose()); document.body.replaceChildren(); });

describe("TimePicker", () => {
    it("uses the configured default time as the first keyboard target", () => {
        const picker = new TimePicker({ defaultTime: "10:00", minuteStep: 15 });
        pickers.push(picker); picker.mount(document.body); picker.focus();
        expect(document.activeElement?.getAttribute("data-time")).toBe("10:00");
    });

    it("moves between quarter-hour slots with arrows", () => {
        const picker = new TimePicker({ value: "10:00", minuteStep: 15 });
        pickers.push(picker); picker.mount(document.body); picker.focus();
        document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
        expect(document.activeElement?.getAttribute("data-time")).toBe("10:15");
    });
});
