import { afterEach, describe, expect, it } from "vitest";
import { DateTimeEditor } from "../../src/components/editors/DateTimeEditor";

const editors: DateTimeEditor[] = [];
afterEach(() => { editors.splice(0).forEach(editor => editor.dispose()); document.body.replaceChildren(); });

describe("DateTimeEditor", () => {
    it("uses a local canonical value and a readable input value", async () => {
        const editor = new DateTimeEditor({ value: "2026-10-14T09:30" });
        editors.push(editor); editor.mount(document.body);
        expect(editor.text).toBe("2026-10-14 09:30");
        expect(await editor.resolveText("2026-10-14 14:05")).toBe("2026-10-14T14:05");
        expect(await editor.resolveText(" ")).toBeNull();
    });
    it("supports seconds and rejects invalid dates", async () => {
        const editor = new DateTimeEditor({ value: "2026-10-14T09:30:15", timeFormat: "HH:mm:ss" });
        editors.push(editor); editor.mount(document.body);
        expect(await editor.resolveText("2026-10-14 23:59:59")).toBe("2026-10-14T23:59:59");
        await expect(editor.resolveText("2026-02-29 10:00:00")).rejects.toThrow();
    });
    it("formats and parses the input with the configured date format", async () => {
        const editor = new DateTimeEditor({ value: "2026-10-14T09:30", dateFormat: "dd.MM.yyyy" });
        editors.push(editor); editor.mount(document.body);
        expect(editor.text).toBe("14.10.2026 09:30");
        expect(await editor.resolveText("14.10.2026 01:00")).toBe("2026-10-14T01:00");
    });
});
