import { describe, expect, it } from "vitest";
import { DateFormatter } from "../../src/formatting/DateFormatter";
import type { ValueFormatter } from "../../src/formatting/ValueFormatter";

describe("DateFormatter", () => {
    it.each([
        ["yyyy-MM-dd", "2024-02-09"], ["dd.MM.yyyy", "09.02.2024"],
        ["M/d/yyyy", "2/9/2024"], ["d-M-yyyy", "9-2-2024"],
        ["yyyy / MM / dd", "2024 / 02 / 09"], ["dd[MM]yyyy", "09[02]2024"]
    ])("formats and parses %s", (pattern, text) => {
        const formatter: ValueFormatter<string> = new DateFormatter(pattern);
        expect(formatter.format("2024-02-09")).toBe(text);
        expect(formatter.parse(` ${text} `)).toBe("2024-02-09");
    });
    it.each(["en-US", "en-GB", "bg-BG", "de-DE", "ja-JP", "ar-EG"])("round-trips locale standard d for %s", locale => {
        const formatter = new DateFormatter("d", locale);
        expect(formatter.parse(formatter.format("2024-02-09"))).toBe("2024-02-09");
        expect(formatter.parse(formatter.format("0001-01-01"))).toBe("0001-01-01");
    });
    it("uses locale field order for standard d", () => {
        expect(new DateFormatter("d", "en-US").format("2024-02-09")).toBe("2/9/2024");
        expect(new DateFormatter("d", "en-GB").format("2024-02-09")).toBe("09/02/2024");
    });
    it.each(["", "D", "dd.MM.yy", "dd.MMM.yyyy", "yyyyMMdd", "dd.MM.yyyy dd", "MM/yyyy", "HH:mm"])(
        "rejects unsupported or incomplete format %s at construction", pattern => {
            expect(() => new DateFormatter(pattern)).toThrow("Failed to create date formatter.");
        });
    it.each(["2026-02-29", "2024-04-31", "2024-00-01", "2024-13-01", "2024-01-00", "0000-01-01", "2024-2-9", "2024-02-09T00:00:00Z"])(
        "rejects invalid ISO value %s", value => {
            const formatter = new DateFormatter();
            expect(() => formatter.parse(value)).toThrow("Failed to parse date.");
            expect(() => formatter.format(value)).toThrow("Failed to format date.");
        });
    it.each(["29.02.2026", "31.04.2024", "09/02/2024", "9.2.2024", "09.02.24", "", "09.02.2024extra"])(
        "rejects invalid/mismatched input %s", text => {
            expect(() => new DateFormatter("dd.MM.yyyy").parse(text)).toThrow("Failed to parse date.");
        });
    it.each(["0001-01-01", "2000-02-29", "2400-02-29", "9999-12-31"])("preserves valid boundary date %s", value => {
        const formatter = new DateFormatter("dd.MM.yyyy");
        expect(formatter.parse(formatter.format(value))).toBe(value);
    });
    it("allows one or two digits only for unpadded fields", () => {
        expect(new DateFormatter("d/M/yyyy").parse("09/02/2024")).toBe("2024-02-09");
    });
});
