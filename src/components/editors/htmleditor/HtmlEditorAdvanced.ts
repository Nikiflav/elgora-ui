import { e } from "../../../core/e";
import type { HtmlEditorElement, HtmlEditorStyle } from "./HtmlEditorModel";
import { isSystemName } from "./HtmlEditorModel";
import { HtmlEditorParser } from "./HtmlEditorParser";
import { parseHtmlEditorStyles } from "./HtmlEditorStyles";
import type { HtmlEditorSurface } from "./HtmlEditorSurface";

/** Renders explicit properties of one fully selected element; changes are model transactions. */
export function renderHtmlEditorAdvanced(host: HTMLElement, surface: HtmlEditorSurface,
    element: HtmlEditorElement | undefined, classOptions: readonly { name: string; text: string }[],
    allowCustomClasses: boolean): void {
    const openGroups = new Set([...host.querySelectorAll<HTMLDetailsElement>("details[open]")].map(item => item.dataset.group));
    const firstRender = !host.childElementCount;
    host.replaceChildren();
    if (!element) { host.textContent = "Select one entire element to edit its properties."; return; }
    const disabled = !surface.editable;
    const group = (id: string, title: string) => {
        const details = e("details", { class: "elg-html-editor-advanced-group", open: firstRender || openGroups.has(id), "data-group": id },
            e("summary", {}, e("i", { class: "ri-arrow-right-s-line elg-html-editor-advanced-chevron", ariaHidden: "true" }), title));
        host.append(details);
        return details;
    };
    const input = (value: string, label: string) => e("input", { class: "elg elg-field", value, ariaLabel: label, disabled });
    const button = (icon: string, label: string, action: () => void, pressed?: boolean) => e("button", { type: "button", class: "elg btn neutral btn-ghost", disabled,
        title: label, ariaLabel: label, ariaPressed: pressed === undefined ? undefined : String(pressed), onclick: action },
        icon === "!" ? "!" : e("i", { class: icon, ariaHidden: "true" }));
    const error = e("div", { class: "elg-html-editor-advanced-error", role: "status" });
    const fail = (message: string) => { error.textContent = message; };
    const apply = (patch: Partial<Pick<HtmlEditorElement, "attributes" | "classes" | "styles">>) => surface.updateElement(element.id, patch);
    const attrs = group("attributes", "Attributes");
    const setAttribute = (oldName: string | undefined, name: string, value: string) => {
        name = name.trim().toLowerCase();
        if (!name || name === "class" || name === "style" || isSystemName(name)) { fail("Enter a supported attribute name."); return; }
        const source = document.createElement(element.tag);
        try { source.setAttribute(name, value); } catch { fail("Enter a valid attribute name."); return; }
        const parsed = new HtmlEditorParser().parse(source.outerHTML).children[0];
        if (!parsed || parsed.type !== "element" || !(name in parsed.attributes)) { fail("This attribute or value is not supported."); return; }
        const attributes = { ...element.attributes };
        if (oldName && oldName !== name) delete attributes[oldName];
        attributes[name] = parsed.attributes[name];
        apply({ attributes });
    };
    const disabledPrefix = "data-elg-disabled-";
    for (const [storedName, value] of Object.entries(element.attributes)) {
        const enabled = !storedName.startsWith(disabledPrefix);
        const name = enabled ? storedName : storedName.slice(disabledPrefix.length);
        const nameInput = input(name, "Attribute name");
        const valueInput = input(value, "Attribute value");
        const commit = () => {
            if (enabled) { setAttribute(storedName, nameInput.value, valueInput.value); return; }
            const nextName = nameInput.value.trim().toLowerCase();
            if (!nextName || isSystemName(nextName) || nextName === "class" || nextName === "style") { fail("Enter a supported attribute name."); return; }
            const attributes = { ...element.attributes }; delete attributes[storedName]; attributes[disabledPrefix + nextName] = valueInput.value;
            apply({ attributes });
        };
        nameInput.addEventListener("change", commit); valueInput.addEventListener("change", commit);
        const toggle = e("input", { type: "checkbox", checked: enabled, disabled, ariaLabel: `Enable ${name}`,
            onchange: () => {
                const nextName = enabled ? disabledPrefix + name : name;
                if (nextName in element.attributes) { fail("An attribute with that name already exists."); return; }
                if (!enabled) {
                    const source = document.createElement(element.tag); source.setAttribute(name, value);
                    const parsed = new HtmlEditorParser().parse(source.outerHTML).children[0];
                    if (!parsed || parsed.type !== "element" || !(name in parsed.attributes)) { fail("This attribute or value is not supported."); return; }
                }
                const attributes = { ...element.attributes }; delete attributes[storedName]; attributes[nextName] = value; apply({ attributes });
            } });
        attrs.append(e("div", { class: "elg-html-editor-advanced-row elg-html-editor-advanced-attribute-row" }, toggle, nameInput, valueInput,
            button("ri-close-line", "Remove attribute", () => { const attributes = { ...element.attributes }; delete attributes[storedName]; apply({ attributes }); })));
    }
    const newName = input("", "New attribute name"), newValue = input("", "New attribute value");
    attrs.append(e("div", { class: "elg-html-editor-advanced-row elg-html-editor-advanced-attribute-row" }, e("span"), newName, newValue,
        button("ri-add-line", "Add attribute", () => setAttribute(undefined, newName.value, newValue.value))));
    const classes = group("classes", "Classes");
    const classInput = input(element.classes.join(" "), "Classes");
    classInput.readOnly = !allowCustomClasses;
    classInput.addEventListener("change", () => {
        const values = [...new Set(classInput.value.split(/\s+/).filter(Boolean))];
        if (values.some(value => isSystemName(value))) { fail("This class name is reserved."); return; }
        apply({ classes: values });
    });
    classes.append(classInput);
    const classList = e("div", { class: "elg-html-editor-advanced-classes" });
    for (const name of element.classes) {
        classList.append(e("span", { class: "elg-html-editor-advanced-class" }, name,
            button("ri-close-line", `Remove ${name}`, () => apply({ classes: element.classes.filter(item => item !== name) }))));
    }
    classes.append(classList);
    if (classOptions.length) {
        const choices = e("details", { class: "elg-html-editor-class-options" }, e("summary", {},
            e("i", { class: "ri-arrow-right-s-line elg-html-editor-advanced-chevron", ariaHidden: "true" }), "Choose classes"));
        for (const option of classOptions) {
            if (!option.name || /\s/.test(option.name) || isSystemName(option.name)) continue;
            const checkbox = e("input", { type: "checkbox", checked: element.classes.includes(option.name), disabled,
                onchange: (_event, control) => apply({ classes: control.checked
                    ? [...new Set([...element.classes, option.name])] : element.classes.filter(name => name !== option.name) }) });
            choices.append(e("label", {}, checkbox, ` ${option.text}`));
        }
        classes.append(choices);
    }
    const styles = group("styles", "Inline styles");
    const setStyle = (index: number | undefined, name: string, value: string, important: boolean) => {
        const parsed = parseHtmlEditorStyles(`${name}: ${value}${important ? " !important" : ""};`);
        if (parsed.length !== 1 || parsed[0].name !== name.trim().toLowerCase() && parsed[0].name !== name.trim()) {
            fail("Enter a supported CSS property and value."); return;
        }
        const next: HtmlEditorStyle[] = [...element.styles];
        if (index === undefined) next.push(parsed[0]); else next[index] = { ...parsed[0], ...(element.styles[index].disabled ? { disabled: true } : {}) };
        apply({ styles: next });
    };
    element.styles.forEach((style, index) => {
        if (style.comment) return;
        const name = input(style.name, "CSS property"), value = input(style.value, "CSS value");
        const commit = () => setStyle(index, name.value, value.value, !!style.important);
        name.addEventListener("change", commit); value.addEventListener("change", commit);
        const toggle = e("input", { type: "checkbox", checked: !style.disabled, disabled, ariaLabel: `Enable ${style.name}`,
            onchange: () => { const next = [...element.styles]; const { disabled: wasDisabled, ...rest } = style;
                next[index] = wasDisabled ? rest : { ...rest, disabled: true }; apply({ styles: next }); } });
        styles.append(e("div", { class: "elg-html-editor-advanced-row elg-html-editor-advanced-style-row" }, toggle, name, value,
            button("!", "Important", () => setStyle(index, name.value, value.value, !style.important), !!style.important),
            button("ri-close-line", "Remove style", () => apply({ styles: element.styles.filter((_, i) => i !== index) }))));
    });
    const styleName = input("", "New CSS property"), styleValue = input("", "New CSS value");
    styles.append(e("div", { class: "elg-html-editor-advanced-row elg-html-editor-advanced-style-row" }, e("span"), styleName, styleValue, e("span"),
        button("ri-add-line", "Add style", () => setStyle(undefined, styleName.value, styleValue.value, false))));
    host.append(error);
}
