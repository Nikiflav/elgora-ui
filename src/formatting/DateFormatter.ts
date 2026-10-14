import type { ValueFormatter } from "./ValueFormatter";

type DatePart = { token: "d" | "dd" | "M" | "MM" | "yyyy" } | { literal: string };

/**
 * Date-only formatting/parsing for ISO YYYY-MM-DD values, without timezone conversion.
 * Supports d, dd, M, MM, yyyy and non-alphanumeric separators. Standard format "d"
 * uses the locale's Gregorian short-date order and separators with Latin digits.
 * This is a documented subset, not full .NET format compatibility.
 * @example new DateFormatter("dd.MM.yyyy").parse("14.10.2026"); // "2026-10-14"
 */
export class DateFormatter implements ValueFormatter<string> {
    /** Requested format; defaults to yyyy-MM-dd. */
    readonly pattern: string;
    private readonly parts: DatePart[];
    private readonly expression: RegExp;

    /** Compiles a format once; unsupported tokens, missing fields and ambiguous layouts throw. */
    constructor(pattern = "yyyy-MM-dd", locale?: string) {
        this.pattern = pattern;
        const expanded = pattern;
        let localizedParts: DatePart[] | undefined;
        if (pattern === "d") {
            const sample = new Date(Date.UTC(1987, 1, 3));
            const intl = new Intl.DateTimeFormat(locale, { year: "numeric", month: "numeric", day: "numeric",
                calendar: "gregory", numberingSystem: "latn", timeZone: "UTC" });
            localizedParts = intl.formatToParts(sample).map((part): DatePart => {
                if (part.type === "year") return { token: "yyyy" };
                if (part.type === "month") return { token: part.value.length === 2 ? "MM" : "M" };
                if (part.type === "day") return { token: part.value.length === 2 ? "dd" : "d" };
                if (part.type === "literal") return { literal: part.value };
                throw new Error("Failed to create date formatter. The locale's date format contains unsupported fields.");
            });
        }
        this.parts = localizedParts ?? [];
        const fields = new Set<string>(localizedParts ? ["year", "M", "d"] : []);
        for (let index = 0; !localizedParts && index < expanded.length;) {
            const token = /^(yyyy|dd|MM|d|M)/.exec(expanded.slice(index))?.[0] as Extract<DatePart, { token: string }>["token"] | undefined;
            if (token) {
                const field = token === "yyyy" ? "year" : token[0];
                if (fields.has(field) || (this.parts.length && "token" in this.parts[this.parts.length - 1]))
                    throw new Error("Failed to create date formatter. Date fields must occur once and be separated by literals.");
                fields.add(field); this.parts.push({ token }); index += token.length;
            } else {
                const literal = /^[^\p{L}\p{N}]+/u.exec(expanded.slice(index))?.[0];
                if (!literal) throw new Error(`Failed to create date formatter. Unsupported date format '${pattern}'. Use d, dd, M, MM and yyyy with separators.`);
                this.parts.push({ literal }); index += literal.length;
            }
        }
        if (fields.size !== 3) throw new Error("Failed to create date formatter. The format must contain day, month and four-digit year.");
        const source = this.parts.map(part => "token" in part
            ? part.token === "yyyy" ? "(\\d{4})" : part.token.length === 2 ? "(\\d{2})" : "(\\d{1,2})"
            : part.literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("");
        this.expression = new RegExp(`^${source}$`);
    }

    /** Formats a valid ISO date. Invalid dates are rejected rather than normalized. */
    format(value: string): string {
        if (!this.isValidDate(value)) throw new Error("Failed to format date. Use a valid YYYY-MM-DD value.");
        const [year, month, day] = value.split("-");
        return this.parts.map(part => {
            if ("literal" in part) return part.literal;
            switch (part.token) {
                case "yyyy": return year;
                case "MM": return month;
                case "M": return String(Number(month));
                case "dd": return day;
                case "d": return String(Number(day));
            }
        }).join("");
    }

    /** Parses the configured layout into ISO; trims surrounding whitespace but requires exact separators. */
    parse(text: string): string {
        const match = this.expression.exec(text.trim());
        let year = "", month = "", day = "", index = 1;
        if (match) for (const part of this.parts) {
            if ("literal" in part) continue;
            const value = match[index++];
            if (part.token === "yyyy") year = value;
            else if (part.token[0] === "M") month = value.padStart(2, "0");
            else day = value.padStart(2, "0");
        }
        const value = `${year}-${month}-${day}`;
        if (!match || !this.isValidDate(value))
            throw new Error(`Failed to parse date. Use a valid ${this.pattern === "yyyy-MM-dd" ? "YYYY-MM-DD" : this.pattern} date.`);
        return value;
    }

    /** Validates Gregorian date components exactly, including leap years and years 0001–9999. */
    private isValidDate(value: string): boolean {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        if (!match || Number(match[1]) < 1) return false;
        const date = new Date(0);
        date.setUTCFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        return date.getUTCFullYear() === Number(match[1]) && date.getUTCMonth() + 1 === Number(match[2])
            && date.getUTCDate() === Number(match[3]);
    }
}
