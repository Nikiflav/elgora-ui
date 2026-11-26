import type { HtmlEditorElement } from "./HtmlEditorModel";
import { getHtmlEditorStyle, parseHtmlEditorStyles, removeHtmlEditorStyle, setHtmlEditorStyle } from "./HtmlEditorStyles";
const owns = (values: Readonly<Record<string, string>>, key: string): boolean => Object.prototype.hasOwnProperty.call(values, key);

/** One option's stable value and its user-facing label. */
export interface HtmlEditorPropertyOption { id: string; text: string; color?: string; }

/** The host presents the control; providers never own a popup or editor selection. */
export type HtmlEditorPropertyControl =
    | { type: "choices"; options: readonly HtmlEditorPropertyOption[] }
    | { type: "palette"; options: readonly HtmlEditorPropertyOption[] }
    | { type: "color" }
    | { type: "length"; units: readonly string[]; min?: number; max?: number }
    | { type: "text" };

/** Operates only on an editable model copy inside an editor transaction. */
export interface HtmlEditorPropertyProvider {
    readonly id: string;
    readonly text: string;
    readonly control: HtmlEditorPropertyControl;
    read(element: HtmlEditorElement): string | undefined;
    accepts(value: string): boolean;
    apply(element: HtmlEditorElement, value: string): void;
    clear(element: HtmlEditorElement): void;
}

/** A free-form inline value, validated against the editor's CSS policy and browser CSS support. */
export function createHtmlEditorFreeStyleProvider(id: string, text: string, property: string,
    control: Extract<HtmlEditorPropertyControl, { type: "color" | "length" | "text" }>): HtmlEditorPropertyProvider {
    const accepts = (value: string): boolean => {
        const parsed = parseHtmlEditorStyles(`${property}: ${value};`);
        if (parsed.length !== 1 || parsed[0].name !== property || parsed[0].value !== value.trim() || parsed[0].important) return false;
        if (control.type === "length") {
            const match = /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))([a-z%]+)$/i.exec(value.trim());
            if (!match || !control.units.includes(match[2])) return false;
            const number = Number(match[1]);
            if (!Number.isFinite(number) || control.min !== undefined && number < control.min || control.max !== undefined && number > control.max) return false;
        }
        return typeof CSS === "undefined" || typeof CSS.supports !== "function" || CSS.supports(property, value);
    };
    return { id, text, control, read: element => getHtmlEditorStyle(element.styles, property)?.value,
        accepts, apply: (element, value) => { if (accepts(value)) element.styles = setHtmlEditorStyle(element.styles, property, value.trim()); },
        clear: element => { element.styles = removeHtmlEditorStyle(element.styles, property); } };
}

/** Choice provider with swatches; storage remains the same as the inline choice provider. */
export function createHtmlEditorPaletteProvider(id: string, text: string, property: string,
    options: readonly HtmlEditorPropertyOption[], values: Readonly<Record<string, string>>): HtmlEditorPropertyProvider {
    return { ...createHtmlEditorInlineStyleProvider(id, text, property, options, values), control: { type: "palette", options } };
}

/** Semantic property shared by the toolbar, inspector and its providers. */
export interface HtmlEditorPropertyDefinition {
    readonly id: string;
    readonly cssProperty: string;
    readonly providers: readonly HtmlEditorPropertyProvider[];
}

/** Maps stable option IDs to inline CSS values without touching unrelated declarations. */
export function createHtmlEditorInlineStyleProvider(id: string, text: string, property: string,
    options: readonly HtmlEditorPropertyOption[], values: Readonly<Record<string, string>>): HtmlEditorPropertyProvider {
    return { id, text, control: { type: "choices", options },
        read: element => {
            const current = getHtmlEditorStyle(element.styles, property)?.value;
            return current === undefined ? undefined : Object.entries(values).find(([, value]) => value === current)?.[0] ?? current;
        },
        accepts: value => owns(values, value),
        apply: (element, value) => { if (owns(values, value)) element.styles = setHtmlEditorStyle(element.styles, property, values[value]); },
        clear: element => { element.styles = removeHtmlEditorStyle(element.styles, property); }
    };
}

/** A provider owns only its configured classes; unrelated classes are preserved. */
export function createHtmlEditorClassProvider(id: string, text: string,
    options: readonly HtmlEditorPropertyOption[], classes: Readonly<Record<string, string>>): HtmlEditorPropertyProvider {
    const owned = new Set(Object.values(classes));
    return { id, text, control: { type: "choices", options },
        read: element => Object.entries(classes).find(([, name]) => element.classes.includes(name))?.[0],
        accepts: value => owns(classes, value),
        clear: element => { element.classes = element.classes.filter(name => !owned.has(name)); },
        apply: (element, value) => { if (owns(classes, value)) {
            element.classes = element.classes.filter(name => !owned.has(name)); element.classes.push(classes[value]);
        } }
    };
}

/** Clears recognized settings recursively, then applies the chosen provider at each selected root. */
export function applyHtmlEditorPropertyToSubtree(roots: readonly HtmlEditorElement[],
    providers: readonly HtmlEditorPropertyProvider[], selected: HtmlEditorPropertyProvider, value: string): boolean {
    if (!providers.includes(selected) || !selected.accepts(value)) return false;
    const clear = (element: HtmlEditorElement): void => {
        providers.forEach(provider => provider.clear(element));
        element.children.forEach(child => { if (child.type === "element") clear(child); });
    };
    roots.forEach(root => { clear(root); selected.apply(root, value); });
    return true;
}
