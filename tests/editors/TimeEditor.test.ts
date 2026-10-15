import { afterEach, describe, expect, it } from "vitest";
import { TimeEditor } from "../../src/components/editors/TimeEditor";

const editors: TimeEditor[] = [];
afterEach(() => { editors.splice(0).forEach(editor => editor.dispose()); document.body.replaceChildren(); });

describe("TimeEditor", () => {
    it("parses and commits a time while treating blank input as null", async () => {
        const editor = new TimeEditor({ value: "09:30", onCommit: () => undefined });
        editors.push(editor); editor.mount(document.body);
        expect(editor.text).toBe("09:30");
        expect(await editor.resolveText(" 14:05 ")).toBe("14:05");
        expect(await editor.resolveText(" ")).toBeNull();
    });
    it("supports seconds and rejects invalid values", async () => {
        const editor = new TimeEditor({ value: "09:30:15", timeFormat: "HH:mm:ss" });
        editors.push(editor); editor.mount(document.body);
        expect(await editor.resolveText("23:59:59")).toBe("23:59:59");
        await expect(editor.resolveText("24:00:00")).rejects.toThrow();
    });
});
