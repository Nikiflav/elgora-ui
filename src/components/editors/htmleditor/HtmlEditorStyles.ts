import type { HtmlEditorStyle } from "./HtmlEditorModel";

const propertyName = (name: string) => name.startsWith("--") ? name : name.toLowerCase();

/** Looks up an explicitly authored property, respecting priority. Does not resolve shorthands or computed CSS. */
export function getHtmlEditorStyle(styles: readonly HtmlEditorStyle[], name: string): HtmlEditorStyle | undefined {
    name = propertyName(name);
    let result: HtmlEditorStyle | undefined;
    for (const style of styles) if (!style.disabled && !style.comment && style.name === name && (!result?.important || style.important)) result = style;
    return result;
}

/** Replaces declarations of one property and appends the new declaration. Other shorthand/longhand declarations retain their order. */
export function setHtmlEditorStyle(styles: HtmlEditorStyle[], name: string, value: string, important = false): HtmlEditorStyle[] {
    name = propertyName(name);
    if (!value.trim()) return removeHtmlEditorStyle(styles, name);
    const last = styles[styles.length - 1];
    if (last?.name === name && !last.disabled && !last.comment && last.value === value && !!last.important === important && styles.filter(style => !style.disabled && !style.comment && style.name === name).length === 1) return styles;
    return [...styles.filter(style => style.disabled || style.comment || style.name !== name), { name, value, ...(important ? { important: true as const } : {}) }];
}

/** Removes only declarations with this exact name, returning the original array when unchanged. */
export function removeHtmlEditorStyle(styles: HtmlEditorStyle[], name: string): HtmlEditorStyle[] {
    name = propertyName(name);
    return styles.some(style => !style.disabled && !style.comment && style.name === name)
        ? styles.filter(style => style.disabled || style.comment || style.name !== name) : styles;
}

export function serializeHtmlEditorStyles(styles: readonly HtmlEditorStyle[]): string {
    return styles.map(style => style.comment ? `/*${style.value}*/` : style.disabled
        ? `/* ${style.name}: ${style.value}${style.important ? " !important" : ""}; */`
        : `${style.name}: ${style.value}${style.important ? " !important" : ""};`).join(" ");
}

/** Splits CSS only outside strings/functions; comments cannot introduce fake declarations. */
function splitCss(source: string, separator: string): string[] {
    const parts: string[] = [];
    let part = "", quote = "", depth = 0;
    for (let i = 0; i < source.length; i++) {
        const char = source[i];
        if (char === "\\") { part += char + (source[++i] ?? ""); continue; }
        if (quote) { part += char; if (char === quote) quote = ""; continue; }
        if (char === '"' || char === "'") { quote = char; part += char; continue; }
        if (char === "/" && source[i + 1] === "*") {
            const end = source.indexOf("*/", i + 2);
            if (end < 0) break;
            i = end + 1; part += " "; continue;
        }
        if (char === "(" || char === "[" || char === "{") depth++;
        if (char === ")" || char === "]" || char === "}") depth--;
        if (char === separator && depth === 0) { parts.push(part); part = ""; }
        else part += char;
    }
    parts.push(part);
    return parts;
}

/** Reads supported declarations without CSSOM collapsing duplicates or discarding fallback values unknown to this browser. */
export function parseHtmlEditorStyles(source: string): HtmlEditorStyle[] {
    const allowed = /^(--[\w-]+|display|position|top|right|bottom|left|width|height|min-width|max-width|min-height|max-height|margin(-.*)?|padding(-.*)?|flex(-.*)?|gap|row-gap|column-gap|grid(-.*)?|align(-.*)?|justify(-.*)?|color|background-color|text-align|text-decoration(-.*)?|font(-.*)?|line-height|letter-spacing|border(-.*)?|border-radius|white-space|vertical-align|opacity)$/;
    const parseDeclaration = (declaration: string): HtmlEditorStyle[] => {
        const [rawName, ...rest] = splitCss(declaration, ":");
        const name = propertyName(rawName.trim());
        const rawValue = rest.join(":").trim();
        const important = /!\s*important\s*$/i.test(rawValue);
        const value = rawValue.replace(/!\s*important\s*$/i, "").trim();
        if (!allowed.test(name) || !value || /url\s*\(|expression|@import|[\\<>]/i.test(value)) return [];
        return [{ name, value, ...(important ? { important: true as const } : {}) }];
    };
    const result: HtmlEditorStyle[] = [];
    let part = "", quote = "", depth = 0;
    for (let i = 0; i < source.length; i++) {
        const char = source[i];
        if (char === "\\") { part += char + (source[++i] ?? ""); continue; }
        if (quote) { part += char; if (char === quote) quote = ""; continue; }
        if (char === '"' || char === "'") { quote = char; part += char; continue; }
        if (char === "/" && source[i + 1] === "*") {
            const end = source.indexOf("*/", i + 2);
            if (end < 0) break;
            const comment = source.slice(i + 2, end);
            if (!part.trim() && depth === 0) {
                const declarations = splitCss(comment, ";").filter(item => item.trim());
                const parsed = declarations.length === 1 ? parseDeclaration(declarations[0]) : [];
                if (parsed.length === 1) result.push({ ...parsed[0], disabled: true });
                else result.push({ name: "", value: comment, comment: true });
            } else { result.push({ name: "", value: comment, comment: true }); part += " "; }
            i = end + 1; continue;
        }
        if (char === "(" || char === "[" || char === "{") depth++;
        if (char === ")" || char === "]" || char === "}") depth--;
        if (char === ";" && depth === 0) { result.push(...parseDeclaration(part)); part = ""; }
        else part += char;
    }
    result.push(...parseDeclaration(part));
    return result;
}
