/** Converts values to display text and parses text independently of UI or saving. */
export interface ValueFormatter<T> {
    /** Formats a value without modifying it. Display formats may lose precision. */
    format(value: T): string;
    /** Parses text or throws an explanatory error. No validation callbacks or saving occur. */
    parse(text: string): T;
}
