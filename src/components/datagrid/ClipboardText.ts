/** Reads quoted TSV, including embedded tabs/newlines and doubled quotation marks. */
export function parseClipboardText(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [], cell = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (quoted) {
            if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
            else if (char === '"') quoted = false;
            else cell += char;
        } else if (char === '"' && !cell) quoted = true;
        else if (char === '\t') { row.push(cell); cell = ""; }
        else if (char === '\r' || char === '\n') {
            if (char === '\r' && text[i + 1] === '\n') i++;
            row.push(cell); rows.push(row); row = []; cell = "";
        } else cell += char;
    }
    if (quoted) throw new Error("Failed to paste cells. A quoted clipboard value is not terminated.");
    if (cell || row.length || !rows.length) { row.push(cell); rows.push(row); }
    return rows;
}
