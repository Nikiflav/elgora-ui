import { describe, expect, it } from "vitest";
import { NumberFormatter } from "../../src/formatting/NumberFormatter";
import type { ValueFormatter } from "../../src/formatting/ValueFormatter";

describe("NumberFormatter", () => {
    it.each([
        ["N0", 1234.56, "1,235"], ["N2", 1234.5, "1,234.50"],
        ["N", 1234.5, "1,234.50"], ["F2", 1234.5, "1234.50"], ["F", 1, "1.00"],
        ["P1", .125, "12.5%"], ["P", .125, "12.50%"], ["G", 1234.56789, "1234.56789"],
        ["C$", 1234.5, "1,234.50\u00a0$"], ["C€", 1234.5, "1,234.50\u00a0€"],
        ["CBGN", 1234.5, "1,234.50\u00a0BGN"], ["C0€", 1234.5, "1,235\u00a0€"],
        ["C2BGN", -1234.5, "-1,234.50\u00a0BGN"]
    ] as const)("formats %s", (pattern, value, text) => {
        const formatter: ValueFormatter<number> = new NumberFormatter(pattern, "en-US");
        expect(formatter.format(value)).toBe(text);
        expect(formatter.parse(text)).toBeCloseTo(pattern === "N0" || pattern === "C0€" ? Math.round(value) : value);
    });
    it.each(["bg-BG", "de-DE", "en-US", "en-IN", "ar-EG", "sv-SE"])("round-trips localized numbers in %s", locale => {
        for (const pattern of ["G", "N2", "F2", "P2", "C2€", "CBGN"]) {
            const formatter = new NumberFormatter(pattern, locale);
            for (const value of [0, -0, 1234.5, 1234567.5, -1234567.5])
                expect(formatter.parse(` ${formatter.format(value)} `)).toBe(value);
        }
    });
    it("uses Bulgarian grouping and decimal separators with a literal suffix", () => {
        expect(new NumberFormatter("C2€", "bg-BG").format(1234.5)).toBe("1\u00a0234,50\u00a0€");
        expect(new NumberFormatter("CBGN", "bg-BG").parse("1 234,50 BGN")).toBe(1234.5);
    });
    it("accepts ungrouped input without forcing display precision", () => {
        expect(new NumberFormatter("N2", "en-US").parse("1234.5678")).toBe(1234.5678);
        const general = new NumberFormatter("G", "en-US");
        const small = .00000012345678901234567;
        expect(general.parse(general.format(small))).toBe(small);
    });
    it.each(["", "n2", "G2", "N21", "N100", "F-1", "C", "C2", "C2 BGN", "#,##0.00", "X"])("rejects unsupported pattern %s", pattern => {
        expect(() => new NumberFormatter(pattern)).toThrow();
    });
    it.each([NaN, Infinity, -Infinity, "12", null, undefined])("rejects non-finite/non-number value %s", value => {
        expect(() => new NumberFormatter().format(value as number)).toThrow("Failed to format number");
    });
    it.each(["", " ", "1,23", "1,,234", "12abc", "Infinity", "0x10", "1.2.3", "1e3", "--1"])("rejects malformed text %s", text => {
        expect(() => new NumberFormatter("N2", "en-US").parse(text)).toThrow("Failed to parse number");
    });
    it("requires the configured suffix and rejects grouping for fixed/general formats", () => {
        expect(() => new NumberFormatter("C€").parse("123.00 $")).toThrow();
        expect(() => new NumberFormatter("P", "en-US").parse("12.5")).toThrow();
        expect(() => new NumberFormatter("F2", "en-US").parse("1,234.50")).toThrow();
        expect(() => new NumberFormatter("G", "en-US").parse("1,234")).toThrow();
    });
    it("supports zero and maximum precision, without making rounded display reversible", () => {
        expect(new NumberFormatter("N20", "en-US").format(1)).toBe("1.00000000000000000000");
        const formatter = new NumberFormatter("F2", "en-US");
        expect(formatter.parse(formatter.format(1.234))).toBe(1.23);
    });
});
