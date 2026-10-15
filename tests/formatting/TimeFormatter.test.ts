import { describe, expect, it } from "vitest";
import { TimeFormatter } from "../../src/formatting/TimeFormatter";

describe("TimeFormatter", () => {
    it("accepts valid minute and second values", () => {
        expect(new TimeFormatter().parse(" 09:05 ")).toBe("09:05");
        expect(new TimeFormatter("HH:mm:ss").parse("23:59:58")).toBe("23:59:58");
    });
    it("rejects invalid clock values and patterns", () => {
        expect(() => new TimeFormatter().parse("24:00")).toThrow();
        expect(() => new TimeFormatter("HH:mm:ss").parse("12:60:00")).toThrow();
        expect(() => new TimeFormatter("h:mm")).toThrow();
    });
});
