import type { ValueFormatter } from "./ValueFormatter";
import { LocalizedError } from "../localization/Messages";

/**
 * Locale-aware, .NET-inspired numeric formats: G, N/F/P[0–20], C[0–20]suffix.
 * N groups digits, F omits grouping, P displays a fraction as a percentage.
 * C requires a literal currency symbol/code, placed after the number with a nonbreaking space.
 * This is a subset with a currency extension, not full .NET compatibility.
 * @example new NumberFormatter("C2€", "en-US").format(1234.5); // "1,234.50 €"
 * @example new NumberFormatter("P1", "en-US").parse("12.5%"); // 0.125
 */
export class NumberFormatter implements ValueFormatter<number> {
    /** Original, case-sensitive pattern. N, F, P and C default to two fraction digits; G is general. */
    readonly pattern: string;
    private readonly intl: Intl.NumberFormat;
    private readonly integerIntl: Intl.NumberFormat;
    private readonly decimal: string;
    private readonly group: string;
    private readonly currency: string;
    private readonly percent: boolean;

    /** Compiles and caches Intl formatters for this instance; invalid patterns/locales throw immediately. */
    constructor(pattern = "G", locale?: string) {
        this.pattern = pattern;
        const ordinary = /^(G|[NFP](\d{1,2})?)$/.exec(pattern);
        const currency = /^C(\d{1,2})?([\p{L}\p{Sc}]+)$/u.exec(pattern);
        if (!ordinary && !currency) throw new Error(`Unsupported number format '${pattern}'. Use G, N/F/P[precision] or C[precision]currency.`);
        const kind = pattern[0];
        const precision = Number(currency?.[1] ?? ordinary?.[2] ?? 2);
        if (precision > 20) throw new Error("Number format precision must be between 0 and 20.");
        this.currency = currency?.[2] ?? "";
        this.percent = kind === "P";
        this.intl = new Intl.NumberFormat(locale, {
            numberingSystem: "latn", style: this.percent ? "percent" : "decimal",
            useGrouping: kind !== "F" && kind !== "G",
            ...(kind === "G" ? { maximumSignificantDigits: 21 }
                : { minimumFractionDigits: precision, maximumFractionDigits: precision })
        });
        this.integerIntl = new Intl.NumberFormat(locale, { numberingSystem: "latn", useGrouping: true, maximumFractionDigits: 0 });
        const parts = new Intl.NumberFormat(locale, { numberingSystem: "latn" }).formatToParts(12345.6);
        this.decimal = parts.find(part => part.type === "decimal")!.value;
        this.group = parts.find(part => part.type === "group")?.value ?? "";
    }

    /** Formats finite numbers only. Rounding is presentation-only; no currency conversion is performed. */
    format(value: number): string {
        if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("Failed to format number. Use a finite number.");
        return this.intl.format(value) + (this.currency ? `\u00a0${this.currency}` : "");
    }

    /**
     * Parses this locale's numeric text, accepting grouped or ungrouped digits and optional surrounding whitespace.
     * Currency/percent suffixes are required when configured. Incorrect grouping and trailing text throw.
     * Parsing a rounded label recovers only the displayed precision; empty/null handling belongs to the editor.
     */
    parse(text: string): number {
        const spaces = (value: string) => value.replace(/[\u00a0\u202f]/g, " ");
        let input = spaces(text).trim();
        const fail = (): never => { throw new LocalizedError("numberFormatter.invalidNumber", { pattern: this.pattern }); };
        if (this.currency) {
            const suffix = ` ${this.currency}`;
            if (!input.endsWith(suffix)) return fail();
            input = input.slice(0, -suffix.length);
        }
        let negative = false;
        // Affixes come from Intl, including locale-specific minus signs, percent signs and bidi marks.
        for (const candidate of [-1, 1]) {
            const parts = this.intl.formatToParts(candidate);
            const first = parts.findIndex(part => part.type === "integer");
            let last = parts.length - 1;
            while (!["integer", "fraction"].includes(parts[last].type)) last--;
            const prefix = spaces(parts.slice(0, first).map(part => part.value).join(""));
            const suffix = spaces(parts.slice(last + 1).map(part => part.value).join(""));
            if (input.startsWith(prefix) && input.endsWith(suffix)) {
                input = input.slice(prefix.length, suffix ? -suffix.length : undefined);
                negative = candidate < 0;
                break;
            }
            if (candidate === 1) return fail();
        }
        const pieces = input.split(this.decimal);
        if (pieces.length > 2 || (pieces.length === 2 && !/^\d+$/.test(pieces[1]))) return fail();
        const integer = pieces[0];
        const group = spaces(this.group);
        const digits = group ? integer.split(group).join("") : integer;
        if (!/^\d+$/.test(digits)) return fail();
        if (integer !== digits && (this.pattern[0] === "F" || this.pattern === "G"
            || integer !== spaces(this.integerIntl.format(BigInt(digits))))) return fail();
        let value = Number(`${negative ? "-" : ""}${digits}${pieces.length === 2 ? `.${pieces[1]}` : ""}`);
        if (this.percent) value /= 100;
        return Number.isFinite(value) ? value : fail();
    }
}
