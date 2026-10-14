import { e, assignElementProps, type ElementProps } from "../../core/e";

/** Layout props supplied on every adornment patch so positioning is retained. */
export const inputAdornmentProps: ElementProps<HTMLElement> = {
    ui: ["position-absolute", "d-flex", "items-center"],
    style: { right: "0.25rem", top: "50%", transform: "translateY(-50%)" }
};

const inputErrorAdornmentProps: ElementProps<HTMLElement> = {
    ui: ["position-absolute", "d-flex", "items-center"],
    style: { left: "0.25rem", top: "50%", transform: "translateY(-50%)" }
};

function ensureInputFrame(input: HTMLInputElement): HTMLElement {
    const parent = input.parentElement!;
    if (parent.classList.contains("elg-input-frame")) return parent;
    const frame = e("div", { class: "elg-input-frame", ui: ["position-relative", "min-w-0"] });
    parent.insertBefore(frame, input);
    frame.append(input);
    return frame;
}

/** Wraps a stable input with an inset adornment root, reserving space for its button. */
export function createInputAdornment(input: HTMLInputElement): HTMLElement {
    const frame = ensureInputFrame(input);
    assignElementProps(input, { style: { width: "100%", minWidth: "0", boxSizing: "border-box", paddingRight: "2rem" } });
    const adornment = e("div", inputAdornmentProps);
    frame.append(adornment);
    return adornment;
}

/** Creates the stable left-side slot used for compact validation feedback. */
export function createInputErrorAdornment(input: HTMLInputElement): HTMLElement {
    const frame = ensureInputFrame(input);
    const adornment = e("div", { ...inputErrorAdornmentProps, class: "elg-input-error-adornment", hidden: true });
    frame.append(adornment);
    return adornment;
}
