import type { ValueFormatter } from "./ValueFormatter";
import { LocalizedError } from "../localization/Messages";

/** Formats and parses strict 24-hour time values without timezone conversion. */
export class TimeFormatter implements ValueFormatter<string> {
    /** Validated 24-hour pattern used for parsing and formatting. */
    readonly pattern: "HH:mm" | "HH:mm:ss";
    private readonly expression: RegExp;

    /** Creates a formatter for hours and minutes, optionally including seconds. */
    constructor(pattern: string = "HH:mm") {
        if (pattern !== "HH:mm" && pattern !== "HH:mm:ss")
            throw new Error("Failed to create time formatter. Use HH:mm or HH:mm:ss.");
        this.pattern = pattern;
        this.expression = pattern === "HH:mm" ? /^(\d{2}):(\d{2})$/ : /^(\d{2}):(\d{2}):(\d{2})$/;
    }

    /** Formats a canonical time value. */
    format(value: string): string {
        if (!this.isValid(value)) throw new LocalizedError("timeFormatter.invalidValue");
        return value;
    }

    /** Parses a strict 24-hour time and rejects invalid clock values. */
    parse(text: string): string {
        const value = text.trim();
        const match = this.expression.exec(value);
        const seconds = this.pattern === "HH:mm" ? "00" : match?.[3];
        if (!match || Number(match[1]) > 23 || Number(match[2]) > 59 || Number(seconds) > 59)
            throw new LocalizedError("timeFormatter.invalidTime", { pattern: this.pattern });
        return this.pattern === "HH:mm" ? value : value;
    }

    private isValid(value: string): boolean {
        try { this.parse(value); return true; } catch { return false; }
    }
}
