import type { UiStyle } from "./UiStyle";

type ClassKey = "class" | "className" | "ui";
const classKeys: readonly ClassKey[] = ["class", "className", "ui"];
type ClassSources = Record<ClassKey, Set<string>>;
const managedClasses = new WeakMap<HTMLElement, ClassSources>();

/** Identifies props that jointly describe one declarative class set. */
export function isClassProp(key: string): key is ClassKey {
    return key === "class" || key === "className" || key === "ui";
}

/** Converts typed UI styles to literal classes, retaining the special elg marker. */
export function uiClassNames(ui?: UiStyle | UiStyle[] | null | false): string[] {
    if (!ui) return [];
    return (Array.isArray(ui) ? ui : [ui])
        .filter(Boolean).map(style => style === "elg" ? "elg" : "elg-" + style);
}

/** Splits literal class props on whitespace, removing empty tokens and duplicates. */
function literalClasses(value: unknown): Set<string> {
    return new Set(value == null ? [] : String(value).split(/\s+/).filter(Boolean));
}

/** Collects the union of all declaratively managed classes. */
function collect(sources: ClassSources): Set<string> {
    return new Set([...sources.class, ...sources.className, ...sources.ui]);
}

/**
 * Normalizes class/className/ui together and patches only their managed class tokens.
 * A full patch replaces all sources; assign preserves sources omitted from props.
 * Tokens are snapshotted, so later mutation of a supplied ui array cannot corrupt the diff.
 * Other DOM classes, including bindClass state, are retained.
 * Do not control the same class token through both declarative props and bindClass/classList:
 * a DOM token has no independent ownership for those two writers.
 */
export function patchClassProps(el: HTMLElement, props: Record<string, any>, assign = false): void {
    const previous = managedClasses.get(el);
    if (!previous && !classKeys.some(key => key in props)) return;
    if (assign && !classKeys.some(key => key in props)) return;
    const next: ClassSources = {
        class: new Set(), className: new Set(), ui: new Set()
    };
    for (const key of classKeys) {
        if (key in props) next[key] = key === "ui"
            ? new Set(uiClassNames(props.ui)) : literalClasses(props[key]);
        else if (assign && previous) next[key] = previous[key];
    }
    const oldTokens = previous ? collect(previous) : new Set<string>();
    const newTokens = collect(next);
    for (const token of oldTokens) if (!newTokens.has(token)) el.classList.remove(token);
    for (const token of newTokens) if (!el.classList.contains(token)) el.classList.add(token);
    managedClasses.set(el, next);
}
