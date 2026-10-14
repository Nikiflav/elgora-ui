/** Reads an exact date-only string without normalization or timezone conversion. */
export function parseCalendarDate(value: string): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match || Number(match[1]) < 1) throw new Error("Failed to read calendar date. Use a valid YYYY-MM-DD date.");
    const date = new Date(0);
    date.setUTCFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    date.setUTCHours(12, 0, 0, 0);
    if (formatCalendarDate(date) !== value) throw new Error("Failed to read calendar date. Use a valid YYYY-MM-DD date.");
    return date;
}

/** Formats internal calendar arithmetic as YYYY-MM-DD, not a timestamp. */
export function formatCalendarDate(date: Date): string {
    return `${String(date.getUTCFullYear()).padStart(4, "0")}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

/** Reads today's browser-local day without converting it to UTC. */
export function localCalendarToday(): string {
    const date = new Date();
    return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
